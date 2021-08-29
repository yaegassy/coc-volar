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
import * as vueTscVersion from './features/vueTscVersion';

import { VolarCodeActionProvider } from './action';

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

  const devVolarServerPath = extensionConfig.get<string>('dev.serverPath', '');
  if (devVolarServerPath && devVolarServerPath !== '' && fs.existsSync(devVolarServerPath)) {
    serverModule = devVolarServerPath;
  } else {
    serverModule = context.asAbsolutePath(path.join('node_modules', '@volar', 'server', 'out', 'index.js'));
  }

  lowPowerMode = isLowPowerMode();

  apiClient = createLanguageService(context, 'api', 'volar-api', 'Volar - API', 6009, 'file');
  docClient = !lowPowerMode
    ? createLanguageService(context, 'doc', 'volar-document', 'Volar - Document', 6010, 'file')
    : undefined;
  htmlClient = createLanguageService(context, 'html', 'volar-html', 'Volar - HTML', 6011, undefined);

  const clients = [apiClient, docClient, htmlClient].filter(shared.notEmpty);

  registarRestartRequest();
  registarClientRequests();

  splitEditors.activate(context);
  verifyAll.activate(context, docClient ?? apiClient);
  tagClosing.activate(context, htmlClient);
  refComplete.activate(context, apiClient);
  vueTscVersion.activate(context, outputChannel);

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
  context.subscriptions.push(
    commands.registerCommand('volar.version', () => {
      const clientJSON = path.join(context.extensionPath, 'package.json');
      const clientPackage = JSON.parse(fs.readFileSync(clientJSON, 'utf8'));
      const serverJSON = path.join(context.extensionPath, 'node_modules', '@volar', 'server', 'package.json');
      const serverPackage = JSON.parse(fs.readFileSync(serverJSON, 'utf8'));
      window.showMessage(`coc-volar(client) v${clientPackage.version} with volar(server) v${serverPackage.version}`);
    })
  );

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
  scheme: string | undefined
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

  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    outputChannel.appendLine(`currentTsPath: ${resolveCurrentTsPaths.serverPath}`);
    outputChannel.appendLine(`localizePath: ${resolveCurrentTsPaths.localizedPath}`);
    outputChannel.appendLine(`isWorkspacePath: ${resolveCurrentTsPaths.isWorkspacePath}`);
  }

  const serverInitOptions: shared.ServerInitializationOptions = {
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
    documentSelector: [
      { scheme, language: 'vue' },
      { scheme, language: 'javascript' },
      { scheme, language: 'typescript' },
      { scheme, language: 'javascriptreact' },
      { scheme, language: 'typescriptreact' },
    ],
    initializationOptions: serverInitOptions,
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

function isLowPowerMode() {
  return !!workspace.getConfiguration('volar').get<boolean>('lowPowerMode');
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

function getConfigFixCompletion() {
  return workspace.getConfiguration('volar').get<boolean>('fix.completion', true);
}
