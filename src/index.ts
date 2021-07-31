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
import * as path from 'upath';
import fs from 'fs';

////////////
//  TODO  //
////////////

import * as activeSelection from './features/activeSelection';
import * as attrNameCase from './features/attrNameCase';
/** MEMO: Cannot be ported due to use of webview */
// import * as callGraph from './features/callGraph';
import * as createWorkspaceSnippets from './features/createWorkspaceSnippets';
import * as documentVersion from './features/documentVersion';
import * as documentContent from './features/documentContent';
/** MEMO: Cannot be ported due to use of webview */
// import * as preview from './features/preview';
import * as restart from './features/restart';
import * as showReferences from './features/showReferences';
// import * as splitEditors from './features/splitEditors';
// import * as tagClosing from './features/tagClosing';
import * as tagNameCase from './features/tagNameCase';
// import * as tsPlugin from './features/tsPlugin';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';
import * as virtualFiles from './features/virtualFiles';
import * as removeRefSugars from './features/removeRefSugars';

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

  // splitEditors.activate(context);
  /** MEMO: Cannot be ported due to use of webview */
  // preview.activate(context);
  // @ts-ignore
  createWorkspaceSnippets.activate(context);
  /** MEMO: Cannot be ported due to use of webview */
  // callGraph.activate(context, apiClient);
  // @ts-ignore
  removeRefSugars.activate(context, apiClient);
  // @ts-ignore
  showReferences.activate(context, apiClient);
  // @ts-ignore
  documentVersion.activate(context, docClient);
  // @ts-ignore
  documentContent.activate(context, apiClient);
  // @ts-ignore
  documentContent.activate(context, docClient);
  // @ts-ignore
  activeSelection.activate(context, apiClient);
  // @ts-ignore
  verifyAll.activate(context, docClient);
  // @ts-ignore
  virtualFiles.activate(context, docClient);
  // tagClosing.activate(context, htmlClient, apiClient);
  // @ts-ignore
  restart.activate(context, [apiClient, docClient]);
  // tsPlugin.activate(context);
  // @ts-ignore
  tsVersion.activate(context, [apiClient, docClient]);

  (async () => {
    // @ts-ignore
    const getTagNameCase = await tagNameCase.activate(context, apiClient);
    // @ts-ignore
    const getAttrNameCase = await attrNameCase.activate(context, apiClient);

    // @ts-ignore
    apiClient.onRequest(shared.GetDocumentNameCasesRequest.type, async (handler) => ({
      // @ts-ignore
      tagNameCase: getTagNameCase(handler.uri),
      // @ts-ignore
      attrNameCase: getAttrNameCase(handler.uri),
    }));
  })();
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
            //references: { enabledInTsScript: !tsPlugin.isTsPluginEnabled() },
            references: { enabledInTsScript: isTsPluginEnabled(context) },
            definition: true,
            typeDefinition: true,
            callHierarchy: { enabledInTsScript: true /** TODO: wait for ts plugin support call hierarchy */ },
            hover: true,
            rename: true,
            renameFileRefactoring: true,
            selectionRange: true,
            signatureHelp: true,
            completion: {
              defaultTagNameCase: 'both',
              defaultAttrNameCase: 'kebabCase',
              getDocumentNameCasesRequest: true,
              getDocumentSelectionRequest: true,
            },
            schemaRequestService: { getDocumentContentRequest: true },
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
            schemaRequestService: { getDocumentContentRequest: true },
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

// MEMO: Ported from tsPlugin.ts for coc.nvim
export function isTsPluginEnabled(context: ExtensionContext) {
  const packageJson = path.join(context.extensionPath, 'package.json');
  try {
    const packageText = fs.readFileSync(packageJson, 'utf8');
    if (packageText.indexOf(`"typescriptServerPlugins"`) >= 0) {
      return true;
    }
  } catch {}

  return false;
}
