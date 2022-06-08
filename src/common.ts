import * as shared from '@volar/shared';
import { commands, DocumentSelector, ExtensionContext, LanguageClient, Thenable, workspace } from 'coc.nvim';
import * as doctor from './client/commands/doctor';
import * as initializeTakeOverMode from './client/commands/initializeTakeOverMode';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
import * as statusBar from './client/statusBar';
import * as autoInsertion from './features/autoInsertion';
import * as documentVersion from './features/documentVersion';
import * as fileReferences from './features/fileReferences';
import * as inlayHints from './features/inlayHints';
import * as showReferences from './features/showReferences';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';

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
  initializeTakeOverMode.register(context);

  //
  // For the first activation event
  //

  if (!activated) {
    const { document } = await workspace.getCurrentState();
    if (document.languageId === 'vue') {
      doActivate(context, createLc);
      activated = true;
    }

    if (workspace.getConfiguration('volar').get<boolean>('vitePressSupport.enable', false)) {
      if (!activated && document.languageId === 'markdown') {
        doActivate(context, createLc);
        activated = true;
      }
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

      if (workspace.getConfiguration('volar').get<boolean>('vitePressSupport.enable', false)) {
        if (!activated && document.languageId === 'markdown') {
          doActivate(context, createLc);
          activated = true;
        }
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

  const takeOverMode = takeOverModeEnabled();
  const isVitePressSupport = workspace.getConfiguration('volar').get<boolean>('vitePressSupport.enable', false);

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
  if (isVitePressSupport) languageFeaturesDocumentSelector.push({ scheme: 'file', language: 'markdown' });

  const documentFeaturesDocumentSelector: DocumentSelector = takeOverMode
    ? [
        { language: 'vue' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
      ]
    : [{ language: 'vue' }];
  if (isVitePressSupport) documentFeaturesDocumentSelector.push({ scheme: 'file', language: 'markdown' });

  const _useSecondServer = useSecondServer();

  apiClient = createLc(
    'volar-language-features',
    'Volar - Language Features Server',
    languageFeaturesDocumentSelector,
    getInitializationOptions(context, 'main-language-features', _useSecondServer),
    6009
  );

  docClient = _useSecondServer
    ? createLc(
        'volar-language-features-2',
        'Volar - Second Language Features Server',
        languageFeaturesDocumentSelector,
        getInitializationOptions(context, 'second-language-features', _useSecondServer),
        6010
      )
    : undefined;

  htmlClient = createLc(
    'volar-document-features',
    'Volar - Document Features Server',
    documentFeaturesDocumentSelector,
    getInitializationOptions(context, 'document-features', _useSecondServer),
    6011
  );

  const clients = [apiClient, docClient, htmlClient].filter(shared.notEmpty);

  registerRestartRequest();
  registerClientRequests();

  verifyAll.register(context, docClient ?? apiClient);
  inlayHints.register(context, docClient ?? apiClient);
  fileReferences.register(context, docClient ?? apiClient);
  /** Custom commands for coc-volar */
  doctor.register(context);
  /** Custom snippets completion for coc-volar */
  scaffoldSnippets.register(context);
  /** Custom status-bar for coc-volar */
  statusBar.register(context, docClient ?? apiClient);

  if (
    workspace.getConfiguration('volar').get<boolean>('autoCreateQuotes') ||
    workspace.getConfiguration('volar').get<boolean>('autoClosingTags') ||
    workspace.getConfiguration('volar').get<boolean>('autoCompleteRefs')
  ) {
    autoInsertion.register(context, htmlClient, apiClient);
  }

  async function registerRestartRequest() {
    await Promise.all(clients.map((client) => client.onReady()));

    context.subscriptions.push(
      commands.registerCommand('volar.action.restartServer', async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await Promise.all(clients.map((client) => client.start()));
        registerClientRequests();
      })
    );
  }

  function registerClientRequests() {
    for (const client of clients) {
      showReferences.activate(context, client);
      documentVersion.activate(context, client);
    }
  }
}

function getInitializationOptions(
  context: ExtensionContext,
  mode: 'main-language-features' | 'second-language-features' | 'document-features',
  useSecondServer: boolean
) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-ts-server-path', resolveCurrentTsPaths.serverPath);
  }

  const initializationOptions: shared.ServerInitializationOptions = {
    typescript: resolveCurrentTsPaths,
    languageFeatures:
      mode === 'main-language-features' || mode === 'second-language-features'
        ? {
            ...(mode === 'main-language-features'
              ? {
                  references: true,
                  implementation: true,
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
            ...(mode === 'second-language-features' || (mode === 'main-language-features' && !useSecondServer)
              ? {
                  documentHighlight: true,
                  documentLink: true,
                  codeLens: { showReferencesNotification: true },
                  semanticTokens: true,
                  inlayHints: true,
                  diagnostics: getConfigDiagnostics(),
                  schemaRequestService: true,
                }
              : {}),
          }
        : undefined,
    documentFeatures:
      mode === 'document-features'
        ? {
            selectionRange: true,
            foldingRange: true,
            linkedEditingRange: true,
            documentSymbol: true,
            documentColor: true,
            documentFormatting: getConfigDocumentFormatting(),
          }
        : undefined,
  };

  return initializationOptions;
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([apiClient?.stop(), docClient?.stop(), htmlClient?.stop()].filter(shared.notEmpty));
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

function useSecondServer() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.useSecondServer');
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
    return true;
  } else {
    return undefined;
  }
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
