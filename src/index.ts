import {
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Thenable,
  TransportKind,
  workspace,
} from 'coc.nvim';

import * as shared from '@volar/shared';
import * as path from 'path';

import * as documentVersion from './features/documentVersion';
import * as restart from './features/restart';
import * as showReferences from './features/showReferences';
// import * as tagClosing from './features/tagClosing';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';

let apiClient: LanguageClient;
let docClient: LanguageClient;
let htmlClient: LanguageClient;

export async function activate(context: ExtensionContext): Promise<void> {
  const extensionConfig = workspace.getConfiguration('volar');

  const isEnable = extensionConfig.get<boolean>('enable', true);
  if (!isEnable) {
    return;
  }

  apiClient = createLanguageService(context, 'api', 'volar-api', 'Volar - API', 6009, 'file');
  docClient = createLanguageService(context, 'doc', 'volar-document', 'Volar - Document', 6010, 'file');
  htmlClient = createLanguageService(context, 'html', 'volar-html', 'Volar - HTML', 6011, undefined);

  for (const client of [apiClient, docClient, htmlClient]) {
    showReferences.activate(context, client);
    documentVersion.activate(context, client);
  }

  verifyAll.activate(context, docClient);
  // tagClosing.activate(context, htmlClient);
  restart.activate(context, apiClient);
  restart.activate(context, docClient);
  tsVersion.activate(context, apiClient);
  tsVersion.activate(context, docClient);
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
  const serverModule = context.asAbsolutePath(path.join('node_modules', '@volar', 'server', 'out', 'index.js'));

  const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const serverInitOptions: shared.ServerInitializationOptions = {
    typescript: tsVersion.getCurrentTsPaths(context),
    features:
      mode === 'api'
        ? {
            references: true,
            definition: true,
            typeDefinition: true,
            callHierarchy: true,
            hover: true,
            rename: true,
            renameFileRefactoring: true,
            selectionRange: true,
            signatureHelp: true,
            completion: {
              defaultTagNameCase: getConfigTagNameCase(),
              defaultAttrNameCase: getConfigAttrNameCase(),
            },
            schemaRequestService: true,
          }
        : mode === 'doc'
        ? {
            documentHighlight: true,
            documentSymbol: true,
            documentLink: true,
            documentColor: true,
            codeLens: { showReferencesNotification: true },
            semanticTokens: true,
            codeAction: true,
            diagnostics: { getDocumentVersionRequest: true },
            schemaRequestService: true,
          }
        : undefined,
    htmlFeatures:
      mode === 'html'
        ? {
            foldingRange: true,
            linkedEditingRange: true,
            documentFormatting: true,
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
