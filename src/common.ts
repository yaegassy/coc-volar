import { commands, ExtensionContext, InitializeParams, LanguageClient, Thenable, workspace } from 'coc.nvim';

import { DiagnosticModel, ServerMode, VueServerInitializationOptions } from '@volar/vue-language-server';
import { TextDocumentSyncKind } from 'vscode-languageserver-protocol';

import * as doctor from './client/commands/doctor';
import * as initializeTakeOverMode from './client/commands/initializeTakeOverMode';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
import * as statusBar from './client/statusBar';
import * as autoInsertion from './features/autoInsertion';
import * as componentMeta from './features/componentMeta';
import * as fileReferences from './features/fileReferences';
import * as reloadProject from './features/reloadProject';
import * as showReferences from './features/showReferences';
import * as tsVersion from './features/tsVersion';
import * as verifyAll from './features/verifyAll';
import * as virtualFiles from './features/virtualFiles';

enum LanguageFeaturesKind {
  Semantic,
  Syntactic,
}

let semanticClient: LanguageClient;
let syntacticClient: LanguageClient;

type CreateLanguageClient = (
  id: string,
  name: string,
  langs: string[],
  initOptions: VueServerInitializationOptions,
  fillInitializeParams: (params: InitializeParams) => void,
  port: number
) => LanguageClient;

let resolveCurrentTsPaths: {
  tsdk: string;
  isWorkspacePath: boolean;
};

let activated: boolean;

export async function activate(context: ExtensionContext, createLc: CreateLanguageClient) {
  /** Custom commands for coc-volar */
  initializeTakeOverMode.register(context);

  //
  // For the first activation event
  //

  if (!activated) {
    const { document } = await workspace.getCurrentState();
    const currentlangId = document.languageId;
    if (currentlangId === 'vue') {
      doActivate(context, createLc);
      activated = true;
    }

    if (
      (!activated && currentlangId === 'markdown' && processMd()) ||
      (!activated && currentlangId === 'html' && processHtml())
    ) {
      doActivate(context, createLc);
      activated = true;
    }

    const takeOverMode = takeOverModeEnabled();
    if (
      !activated &&
      takeOverMode &&
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(currentlangId)
    ) {
      doActivate(context, createLc);
      activated = true;
    }
  }

  //
  // If open another file after the activation event
  //

  workspace.onDidOpenTextDocument(
    async () => {
      if (activated) return;

      const { document } = await workspace.getCurrentState();
      const currentlangId = document.languageId;

      if (currentlangId === 'vue') {
        doActivate(context, createLc);
        activated = true;
      }

      if (
        (!activated && currentlangId === 'markdown' && processMd()) ||
        (!activated && currentlangId === 'html' && processHtml())
      ) {
        doActivate(context, createLc);
        activated = true;
      }

      const takeOverMode = takeOverModeEnabled();

      if (
        !activated &&
        takeOverMode &&
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(currentlangId)
      ) {
        doActivate(context, createLc);
        activated = true;
      }
    },
    null,
    context.subscriptions
  );
}

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient) {
  initializeWorkspaceState(context);

  [semanticClient, syntacticClient] = await Promise.all([
    createLc(
      'vue-semantic-server',
      'Vue Semantic Server',
      getDocumentSelector(ServerMode.Semantic),
      getInitializationOptions(ServerMode.Semantic, context),
      getFillInitializeParams([LanguageFeaturesKind.Semantic]),
      6009
    ),
    createLc(
      'vue-syntactic-server',
      'Vue Syntactic Server',
      getDocumentSelector(ServerMode.Syntactic),
      getInitializationOptions(ServerMode.Syntactic, context),
      getFillInitializeParams([LanguageFeaturesKind.Syntactic]),
      6011
    ),
  ]);
  const clients = [semanticClient, syntacticClient];

  registerRestartRequest();
  registerClientRequests();

  reloadProject.register('volar.action.reloadProject', context, semanticClient);
  /** Custom commands for coc-volar */
  doctor.register(context);
  /** Custom snippets completion for coc-volar */
  scaffoldSnippets.register(context);

  if (semanticClient) {
    /** Custom status-bar for coc-volar */
    statusBar.register(context, semanticClient);

    verifyAll.register(context, semanticClient);
    fileReferences.register('volar.vue.findAllFileReferences', semanticClient);

    if (
      workspace.getConfiguration('volar').get<boolean>('autoCreateQuotes') ||
      workspace.getConfiguration('volar').get<boolean>('autoClosingTags') ||
      workspace.getConfiguration('volar').get<boolean>('autoCompleteRefs')
    ) {
      autoInsertion.register(context, syntacticClient, semanticClient);
    }

    virtualFiles.register(context, semanticClient);
    componentMeta.register(context, semanticClient);
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
    }
  }
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([semanticClient?.stop(), syntacticClient?.stop()]);
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

export function getDocumentSelector(serverMode: ServerMode) {
  const takeOverMode = takeOverModeEnabled();
  const langs = takeOverMode ? ['vue', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'] : ['vue'];
  if (takeOverMode && serverMode === ServerMode.Semantic) {
    langs.push('json');
  }
  if (processHtml()) {
    langs.push('html');
  }
  if (processMd()) {
    langs.push('markdown');
  }
  return langs;
}

export function processHtml() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.petiteVue.processHtmlFile');
}

export function processMd() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.vitePress.processMdFile');
}

function getFillInitializeParams(featuresKinds: LanguageFeaturesKind[]) {
  return function (params: InitializeParams) {
    (params as any).locale = workspace.getConfiguration('volar').get<string>('tsLocale', 'en');

    if (params.capabilities.textDocument) {
      if (!featuresKinds.includes(LanguageFeaturesKind.Semantic)) {
        params.capabilities.textDocument.references = undefined;
        params.capabilities.textDocument.implementation = undefined;
        params.capabilities.textDocument.definition = undefined;
        params.capabilities.textDocument.typeDefinition = undefined;
        params.capabilities.textDocument.callHierarchy = undefined;
        params.capabilities.textDocument.hover = undefined;
        params.capabilities.textDocument.rename = undefined;
        params.capabilities.textDocument.signatureHelp = undefined;
        params.capabilities.textDocument.codeAction = undefined;
        params.capabilities.textDocument.completion = undefined;
        // Tardy
        params.capabilities.textDocument.documentHighlight = undefined;
        params.capabilities.textDocument.documentLink = undefined;
        params.capabilities.textDocument.codeLens = undefined;
        params.capabilities.textDocument.semanticTokens = undefined;
        params.capabilities.textDocument.inlayHint = undefined;
        params.capabilities.textDocument.diagnostic = undefined;
      }
      if (!featuresKinds.includes(LanguageFeaturesKind.Syntactic)) {
        params.capabilities.textDocument.selectionRange = undefined;
        params.capabilities.textDocument.foldingRange = undefined;
        params.capabilities.textDocument.linkedEditingRange = undefined;
        params.capabilities.textDocument.documentSymbol = undefined;
        params.capabilities.textDocument.colorProvider = undefined;
        params.capabilities.textDocument.formatting = undefined;
        params.capabilities.textDocument.rangeFormatting = undefined;
        params.capabilities.textDocument.onTypeFormatting = undefined;
      }
    }
    if (params.capabilities.workspace) {
      if (!featuresKinds.includes(LanguageFeaturesKind.Semantic)) {
        params.capabilities.workspace.symbol = undefined;
        params.capabilities.workspace.fileOperations = undefined;
      }
    }
  };
}

function getInitializationOptions(serverMode: ServerMode, context: ExtensionContext) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-ts-server-path', resolveCurrentTsPaths.tsdk);
  }

  const textDocumentSync = workspace
    .getConfiguration('volar')
    .get<'incremental' | 'full' | 'none'>('vueserver.textDocumentSync');
  const initializationOptions: VueServerInitializationOptions = {
    serverMode,
    diagnosticModel: DiagnosticModel.Push,
    textDocumentSync: textDocumentSync
      ? {
          incremental: TextDocumentSyncKind.Incremental,
          full: TextDocumentSyncKind.Full,
          none: TextDocumentSyncKind.None,
        }[textDocumentSync]
      : TextDocumentSyncKind.Incremental,
    typescript: resolveCurrentTsPaths,
    petiteVue: {
      processHtmlFile: processHtml(),
    },
    vitePress: {
      processMdFile: processMd(),
    },
  };
  return initializationOptions;
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
