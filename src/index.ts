import {
  commands,
  DocumentSelector,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  languages,
  ServerOptions,
  Thenable,
  TransportKind,
  window,
  workspace,
} from 'coc.nvim';

import * as shared from '@volar/shared';
import * as path from 'path';
import { existsSync } from 'fs';

import * as documentVersion from './features/documentVersion';
import * as documentPrintWidth from './features/documentPrintWidth';
import * as showReferences from './features/showReferences';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';
import * as removeRefSugars from './features/removeRefSugars';

import { VolarCodeActionProvider } from './action';

let apiClient: LanguageClient;
let docClient: LanguageClient;
let htmlClient: LanguageClient;

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
  if (devVolarServerPath && devVolarServerPath !== '' && existsSync(devVolarServerPath)) {
    serverModule = devVolarServerPath;
  } else {
    serverModule = context.asAbsolutePath(path.join('node_modules', '@volar', 'server', 'out', 'index.js'));
  }

  apiClient = createLanguageService(context, 'api', 'volar-api', 'Volar - API', 6009, 'file');
  docClient = createLanguageService(context, 'doc', 'volar-document', 'Volar - Document', 6010, 'file');
  htmlClient = createLanguageService(context, 'html', 'volar-html', 'Volar - HTML', 6011, undefined);

  const clients = [apiClient, docClient, htmlClient];

  registarRestartRequest();
  registarClientRequests();

  removeRefSugars.activate(context, apiClient);
  verifyAll.activate(context, docClient);

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
    for (const client of [apiClient, docClient, htmlClient]) {
      showReferences.activate(context, client);
      documentVersion.activate(context, client);
      documentPrintWidth.activate(context, client);
    }
  }

  /** MEMO: coc-volar code action feature */
  const languageSelector: DocumentSelector = [{ language: 'vue', scheme: 'file' }];
  const codeActionProvider = new VolarCodeActionProvider();
  context.subscriptions.push(languages.registerCodeActionProvider(languageSelector, codeActionProvider, 'volar'));
}

export function deactivate(): Thenable<void> | undefined {
  return apiClient?.stop() && docClient?.stop() && htmlClient?.stop();
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
      mode === 'api'
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
        : mode === 'doc'
        ? {
            documentHighlight: true,
            documentLink: true,
            codeLens: { showReferencesNotification: true },
            semanticTokens: true,
            diagnostics: { getDocumentVersionRequest: true },
            schemaRequestService: true,
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
  };

  const client = new LanguageClient(id, name, serverOptions, clientOptions);

  context.subscriptions.push(client.start());

  return client;
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
  const tagNameCase = workspace.getConfiguration('volar').get<'kebab' | 'pascal'>('attrNameCase');
  switch (tagNameCase) {
    case 'kebab':
      return 'kebabCase' as const;
    case 'pascal':
      return 'pascalCase' as const;
  }
  return 'kebabCase' as const;
}

type DocumentFormattingType = {
  defaultPrintWidth: number;
  getDocumentPrintWidthRequest: boolean;
};

function getConfigDocumentFormatting(): DocumentFormattingType | undefined {
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
