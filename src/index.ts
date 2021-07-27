import {
  extensions,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Thenable,
  TransportKind,
  workspace,
  window,
} from 'coc.nvim';

import {
  TS_LANGUAGE_FEATURES_EXTENSION,
  CSS_LANGUAGE_FEATURES_EXTENSION,
  HTML_LANGUAGE_FEATURES_EXTENSION,
} from './const';

import type * as shared from '@volar/shared';
//import * as path from 'upath';

/** TODO: */
// import * as activeSelection from './features/activeSelection';
// import * as attrNameCase from './features/attrNameCase';
// import * as callGraph from './features/callGraph';
import * as createWorkspaceSnippets from './features/createWorkspaceSnippets';
import * as documentVersion from './features/documentVersion';
import * as documentContent from './features/documentContent';
// import * as preview from './features/preview';
import * as restart from './features/restart';
// import * as semanticTokens from './features/semanticTokens';
import * as showReferences from './features/showReferences';
// import * as splitEditors from './features/splitEditors';
// import * as tagClosing from './features/tagClosing';
// import * as tagNameCase from './features/tagNameCase';
// import * as tsPlugin from './features/tsPlugin';
// import * as tsVersion from './features/tsVersion';
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

  const serverModule = extensionConfig.get<string>('server.path', '');
  const appRootPath = extensionConfig.get<string>('appRoot.path', '');

  if (!serverModule || !appRootPath) {
    window.showWarningMessage(`Require: set "volar.server.path" and "volar.appRoot.path" in coc-settings.json!`);
    return;
  }

  apiClient = createLanguageService(context, 'api', 'volar-api', 'Volar - API', 6009, true);
  docClient = createLanguageService(context, 'doc', 'volar-document', 'Volar - Document', 6010, true);
  htmlClient = createLanguageService(context, 'html', 'volar-html', 'Volar - HTML', 6011, false);

  // splitEditors.activate(context);
  // preview.activate(context);
  // @ts-ignore
  createWorkspaceSnippets.activate(context);
  // tagNameCase.activate(context, apiClient);
  // attrNameCase.activate(context, apiClient);
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
  // activeSelection.activate(context, apiClient);
  // @ts-ignore
  verifyAll.activate(context, docClient);
  // @ts-ignore
  virtualFiles.activate(context, docClient);
  // semanticTokens.activate(context, docClient);
  // tagClosing.activate(context, htmlClient, apiClient);
  // @ts-ignore
  restart.activate(context, [apiClient, docClient]);
  // tsPlugin.activate(context);
  // tsVersion.activate(context, [apiClient, docClient]);

  //startEmbeddedLanguageServices();
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
  fileOnly: boolean
) {
  const extensionConfig = workspace.getConfiguration('volar');

  const serverModule = extensionConfig.get<string>('server.path', '');
  const appRootPath = extensionConfig.get<string>('appRoot.path', '');
  // REF: https://code.visualstudio.com/docs/getstarted/locales
  const displayLanguage = extensionConfig.get<string>('display.language', 'en');

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
    mode: mode,
    appRoot: appRootPath,
    language: displayLanguage,
    tsPlugin: true,
    tsdk: workspace.getConfiguration('tsserver').get<string>('tsdk') ?? undefined,
    useWorkspaceTsdk: false,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: fileOnly
      ? [
          { scheme: 'file', language: 'vue' },
          { scheme: 'file', language: 'javascript' },
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'javascriptreact' },
          { scheme: 'file', language: 'typescriptreact' },
        ]
      : [
          { language: 'vue' },
          { language: 'javascript' },
          { language: 'typescript' },
          { language: 'javascriptreact' },
          { language: 'typescriptreact' },
        ],
    initializationOptions: serverInitOptions,
  };

  const client = new LanguageClient(id, name, serverOptions, clientOptions);
  context.subscriptions.push(client.start());

  return client;
}

// TODO:
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function startEmbeddedLanguageServices() {
  const ts = extensions.all.find((e) => e.id === TS_LANGUAGE_FEATURES_EXTENSION);
  if (ts) {
    await ts.activate();
  }

  const css = extensions.all.find((e) => e.id === CSS_LANGUAGE_FEATURES_EXTENSION);
  if (css) {
    await css.activate();
  }

  const html = extensions.all.find((e) => e.id === HTML_LANGUAGE_FEATURES_EXTENSION);
  if (html) {
    await html.activate();
  }
}
