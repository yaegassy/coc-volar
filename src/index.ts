import {
  commands,
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionList,
  DocumentSelector,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  languages,
  Position,
  ProvideCompletionItemsSignature,
  ServerOptions,
  Thenable,
  TransportKind,
  window,
  workspace,
} from 'coc.nvim';

import * as shared from '@volar/shared';
import * as path from 'path';
import * as fs from 'fs';

import * as documentVersion from './features/documentVersion';
import * as documentPrintWidth from './features/documentPrintWidth';
import * as showReferences from './features/showReferences';
import * as tagClosing from './features/tagClosing';
import * as refComplete from './features/refComplete';
import * as splitEditors from './features/splitEditors';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';

import { VolarCodeActionProvider } from './client/actions';
import { doctorCommand } from './client/commands';

let apiClient: LanguageClient;
let docClient: LanguageClient | undefined;
let htmlClient: LanguageClient;
let lowPowerMode = false;

let serverModule: string;

// MEMO: client logging
const outputChannel = window.createOutputChannel('volar-client');

let resolveCurrentTsPaths: {
  serverPath: string;
  localizedPath: string | undefined;
  isWorkspacePath: boolean;
};

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('volar');

  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) return;

  outputChannel.appendLine(`${'#'.repeat(10)} volar-client\n`);
  initializeWorkspaceState(context);

  let devVolarServerPath = extensionConfig.get<string>('dev.serverPath', '');
  if (devVolarServerPath) {
    devVolarServerPath = workspace.expand(devVolarServerPath);
    if (fs.existsSync(devVolarServerPath)) {
      serverModule = devVolarServerPath;
    }
  } else {
    serverModule = context.asAbsolutePath(path.join('node_modules', '@volar', 'server', 'out', 'index.js'));
  }

  lowPowerMode = lowPowerModeEnabled();
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

  apiClient = createLanguageService(context, 'api', 'volar-api', 'Volar - API', 6009, languageFeaturesDocumentSelector);
  docClient = !lowPowerMode
    ? createLanguageService(
        context,
        'doc',
        'volar-document',
        'Volar - Document',
        6010,
        languageFeaturesDocumentSelector
      )
    : undefined;
  htmlClient = createLanguageService(
    context,
    'html',
    'volar-html',
    'Volar - HTML',
    6011,
    documentFeaturesDocumentSelector
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

  /** MEMO: for coc-volar */
  context.subscriptions.push(commands.registerCommand('volar.doctor', doctorCommand(context)));

  /** MEMO: for coc-volar */
  const languageSelector: DocumentSelector = [{ language: 'vue', scheme: 'file' }];
  const codeActionProvider = new VolarCodeActionProvider();
  context.subscriptions.push(languages.registerCodeActionProvider(languageSelector, codeActionProvider, 'volar'));
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([apiClient?.stop(), docClient?.stop(), htmlClient?.stop()].filter(shared.notEmpty));
}

function createLanguageService(
  context: ExtensionContext,
  mode: 'api' | 'doc' | 'html',
  id: string,
  name: string,
  port: number,
  documentSelector: DocumentSelector
) {
  const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const memory = Math.floor(Number(getConfigMaxMemory()));
  if (memory && memory >= 256) {
    const maxOldSpaceSize = '--max-old-space-size=' + memory.toString();
    serverOptions.run.options = { execArgv: [maxOldSpaceSize] };
    if (serverOptions.debug.options) {
      if (serverOptions.debug.options.execArgv) {
        serverOptions.debug.options.execArgv.push(maxOldSpaceSize);
      }
    }
  }

  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-ts-server-path', resolveCurrentTsPaths.serverPath);
    outputChannel.appendLine(`currentTsPath: ${resolveCurrentTsPaths.serverPath}`);
    outputChannel.appendLine(`localizePath: ${resolveCurrentTsPaths.localizedPath}`);
    outputChannel.appendLine(`isWorkspacePath: ${resolveCurrentTsPaths.isWorkspacePath}`);
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
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector,
    initializationOptions,
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('{**/*.vue,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.json}'),
    },
    middleware: getConfigFixCompletion()
      ? {
          provideCompletionItem:
            mode === 'api'
              ? async (
                  document,
                  position: Position,
                  context: CompletionContext,
                  token: CancellationToken,
                  next: ProvideCompletionItemsSignature
                ) => {
                  const res = await Promise.resolve(next(document, position, context, token));
                  const doc = workspace.getDocument(document.uri);
                  if (!doc || !res) return [];

                  const items: CompletionItem[] = res.hasOwnProperty('isIncomplete')
                    ? (res as CompletionList).items
                    : (res as CompletionItem[]);

                  // **MEMO**
                  // If further fine-tuning of the completion items is needed, this is the place to do it.
                  // ----
                  // data.mode: 'ts' | 'html' | 'css'
                  // ----
                  // items.forEach((e) => {
                  //   if (e.data?.mode === 'css') {
                  //     //
                  //   }
                  // });

                  return items;
                }
              : undefined,
        }
      : undefined,
  };

  const client = new LanguageClient(id, name, serverOptions, clientOptions);

  context.subscriptions.push(client.start());

  return client;
}

function lowPowerModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('lowPowerMode');
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

function getConfigTagNameCase() {
  const tagNameCase = workspace.getConfiguration('volar').get<'both' | 'kebab' | 'pascal'>('tagNameCase');
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
  const tagNameCase = workspace.getConfiguration('volar').get<'kebab' | 'camel'>('attrNameCase');
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

function getConfigMaxMemory() {
  return workspace.getConfiguration('volar').get<number | null>('maxMemory');
}

function getConfigFixCompletion() {
  return workspace.getConfiguration('volar').get<boolean>('fix.completion', true);
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
