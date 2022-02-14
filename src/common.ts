import { commands, DocumentSelector, ExtensionContext, LanguageClient, Thenable, workspace } from 'coc.nvim';

import * as shared from '@volar/shared';

import * as documentVersion from './features/documentVersion';
import * as documentPrintWidth from './features/documentPrintWidth';
import * as showReferences from './features/showReferences';
import * as tagClosing from './features/tagClosing';
import * as refComplete from './features/refComplete';
import * as splitEditors from './features/splitEditors';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';

import { doctorCommand, initializeTakeOverModeCommand, usePrettierCommand } from './client/commands';

let apiClient: LanguageClient;
let docClient: LanguageClient | undefined;
let htmlClient: LanguageClient;

let resolveCurrentTsPaths: {
  serverPath: string;
  localizedPath: string | undefined;
  isWorkspacePath: boolean;
};

type CreateLanguageClient = (
  id: string,
  name: string,
  documentSelector: DocumentSelector,
  initOptions: shared.ServerInitializationOptions,
  port: number
) => LanguageClient;

let activated: boolean;

export async function activate(context: ExtensionContext, createLc: CreateLanguageClient): Promise<void> {
  /** MEMO: Custom commands for coc-volar */
  context.subscriptions.push(commands.registerCommand('volar.initializeTakeOverMode', initializeTakeOverModeCommand()));

  //
  // For the first activation event
  //

  if (!activated) {
    const { document } = await workspace.getCurrentState();
    if (document.languageId === 'vue') {
      doActivate(context, createLc);
      activated = true;
    }

    if (
      !activated &&
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
    ) {
      const takeOverMode = takeOverModeEnabled();
      if (takeOverMode) {
        doActivate(context, createLc);
        activated = true;
      }
    }
  }

  //
  // If open another file after the activation event
  //

  workspace.onDidOpenTextDocument(
    async () => {
      if (activated) return;

      const { document } = await workspace.getCurrentState();
      if (document.languageId === 'vue') {
        doActivate(context, createLc);
        activated = true;
      }

      if (
        !activated &&
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
      ) {
        const takeOverMode = takeOverModeEnabled();
        if (takeOverMode) {
          doActivate(context, createLc);
          activated = true;
        }
      }
    },
    null,
    context.subscriptions
  );
}

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient): Promise<void> {
  initializeWorkspaceState(context);

  const lowPowerMode = lowPowerModeEnabled();
  const takeOverMode = takeOverModeEnabled();

  const languageFeaturesDocumentSelector: DocumentSelector = takeOverMode
    ? [
        { scheme: 'file', language: 'vue' },
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescriptreact' },
        { scheme: 'file', language: 'json' },
      ]
    : [{ scheme: 'file', language: 'vue' }];
  const documentFeaturesDocumentSelector: DocumentSelector = takeOverMode
    ? [
        { language: 'vue' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
      ]
    : [{ language: 'vue' }];

  apiClient = createLc(
    'volar-api',
    'Volar - API',
    languageFeaturesDocumentSelector,
    getInitializationOptions(context, 'api', undefined, lowPowerMode),
    6009
  );

  docClient = !lowPowerMode
    ? createLc(
        'volar-document',
        'Volar - Document',
        languageFeaturesDocumentSelector,
        getInitializationOptions(context, 'doc', undefined, lowPowerMode),
        6010
      )
    : undefined;

  htmlClient = createLc(
    'volar-html',
    'Volar - HTML',
    documentFeaturesDocumentSelector,
    getInitializationOptions(context, 'html', undefined, lowPowerMode),
    6011
  );

  const clients = [apiClient, docClient, htmlClient].filter(shared.notEmpty);

  registarRestartRequest();
  registarClientRequests();

  splitEditors.activate(context);
  verifyAll.activate(context, docClient ?? apiClient);
  tagClosing.activate(context, htmlClient);
  refComplete.activate(context, apiClient);

  async function registarRestartRequest() {
    await Promise.all(clients.map((client) => client.onReady()));

    context.subscriptions.push(
      commands.registerCommand('volar.action.restartServer', async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await Promise.all(clients.map((client) => client.start()));
        registarClientRequests();
      })
    );
  }

  function registarClientRequests() {
    for (const client of clients) {
      showReferences.activate(context, client);
      documentVersion.activate(context, client);
      documentPrintWidth.activate(context, client);
    }
  }

  /** MEMO: Custom commands for coc-volar */
  context.subscriptions.push(commands.registerCommand('volar.doctor', doctorCommand(context)));
  /** MEMO: Custom commands for coc-volar */
  context.subscriptions.push(commands.registerCommand('volar.usePrettier', usePrettierCommand()));
}

function getInitializationOptions(
  context: ExtensionContext,
  mode: 'api' | 'doc' | 'html',
  initMessage: string | undefined,
  lowPowerMode: boolean
) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-ts-server-path', resolveCurrentTsPaths.serverPath);
  }

  const initializationOptions: shared.ServerInitializationOptions = {
    typescript: resolveCurrentTsPaths,
    languageFeatures:
      mode === 'api' || mode === 'doc'
        ? {
            ...(mode === 'api'
              ? {
                  references: true,
                  definition: true,
                  typeDefinition: true,
                  callHierarchy: true,
                  hover: true,
                  rename: true,
                  renameFileRefactoring: true,
                  signatureHelp: true,
                  codeAction: true,
                  workspaceSymbol: true,
                  completion: {
                    defaultTagNameCase: getConfigTagNameCase(),
                    defaultAttrNameCase: getConfigAttrNameCase(),
                    getDocumentNameCasesRequest: false /** MEMO: Set to false for coc-volar */,
                    getDocumentSelectionRequest: false /** MEMO: Set to false for coc-volar */,
                  },
                  schemaRequestService: true,
                }
              : {}),
            ...(mode === 'doc' || (mode === 'api' && lowPowerMode)
              ? {
                  documentHighlight: true,
                  documentLink: true,
                  codeLens: { showReferencesNotification: true },
                  semanticTokens: true,
                  diagnostics: getConfigDiagnostics(),
                  schemaRequestService: true,
                }
              : {}),
          }
        : undefined,
    documentFeatures:
      mode === 'html'
        ? {
            selectionRange: true,
            foldingRange: true,
            linkedEditingRange: true,
            documentSymbol: true,
            documentColor: true,
            documentFormatting: getConfigDocumentFormatting(),
          }
        : undefined,
    initializationMessage: initMessage,
  };

  return initializationOptions;
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([apiClient?.stop(), docClient?.stop(), htmlClient?.stop()].filter(shared.notEmpty));
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

function lowPowerModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('lowPowerMode');
}

function getConfigTagNameCase() {
  const tagNameCase = workspace.getConfiguration('volar').get<'both' | 'kebab' | 'pascal'>('completion.tagNameCase');
  switch (tagNameCase) {
    case 'both':
      return 'both' as const;
    case 'kebab':
      return 'kebabCase' as const;
    case 'pascal':
      return 'pascalCase' as const;
  }
  return 'both' as const;
}

function getConfigAttrNameCase() {
  const tagNameCase = workspace.getConfiguration('volar').get<'kebab' | 'camel'>('completion.attrNameCase');
  switch (tagNameCase) {
    case 'kebab':
      return 'kebabCase' as const;
    case 'camel':
      return 'camelCase' as const;
  }
  return 'kebabCase' as const;
}

function getConfigDiagnostics(): NonNullable<shared.ServerInitializationOptions['languageFeatures']>['diagnostics'] {
  const isDiagnosticsEnable = workspace.getConfiguration('volar').get<boolean>('diagnostics.enable', true);

  if (isDiagnosticsEnable) {
    return { getDocumentVersionRequest: true };
  } else {
    return undefined;
  }
}

function getConfigDocumentFormatting(): NonNullable<
  shared.ServerInitializationOptions['documentFeatures']
>['documentFormatting'] {
  const isFormattingEnable = workspace.getConfiguration('volar').get<boolean>('formatting.enable', true);

  if (isFormattingEnable) {
    return {
      defaultPrintWidth: 100,
      getDocumentPrintWidthRequest: true,
    };
  } else {
    return undefined;
  }
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
