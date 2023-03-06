import { commands, ExtensionContext, LanguageClient, Thenable, workspace } from 'coc.nvim';

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
import * as serverStatus from './features/serverStatus';
import * as showReferences from './features/showReferences';
import * as tsVersion from './features/tsVersion';
import * as virtualFiles from './features/virtualFiles';

let semanticClient: LanguageClient;
let syntacticClient: LanguageClient;

type CreateLanguageClient = (
  id: string,
  name: string,
  langs: string[],
  initOptions: VueServerInitializationOptions,
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
    const currentLangId = document.languageId;
    if (currentLangId === 'vue') {
      doActivate(context, createLc);
      activated = true;
    }

    if (
      (!activated && currentLangId === 'markdown' && processMd()) ||
      (!activated && currentLangId === 'html' && processHtml())
    ) {
      doActivate(context, createLc);
      activated = true;
    }

    const takeOverMode = takeOverModeEnabled();
    if (
      !activated &&
      takeOverMode &&
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(currentLangId)
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
      getDocumentSelector(context),
      getInitializationOptions(ServerMode.PartialSemantic, context),
      6009
    ),
    createLc(
      'vue-syntactic-server',
      'Vue Syntactic Server',
      getDocumentSelector(context),
      getInitializationOptions(ServerMode.Syntactic, context),
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

    fileReferences.register('volar.vue.findAllFileReferences', semanticClient);

    if (
      workspace.getConfiguration('volar').get<boolean>('autoCreateQuotes') ||
      workspace.getConfiguration('volar').get<boolean>('autoClosingTags') ||
      workspace.getConfiguration('volar').get<boolean>('autoCompleteRefs')
    ) {
      autoInsertion.register(context, syntacticClient, semanticClient);
    }

    virtualFiles.register(context, semanticClient);
    serverStatus.register(context, semanticClient);
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getDocumentSelector(_context: ExtensionContext) {
  const takeOverMode = takeOverModeEnabled();
  const langs = takeOverMode ? ['vue', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'] : ['vue'];
  if (takeOverMode) {
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

export function noProjectReferences() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.noProjectReferences');
}

export function reverseConfigFilePriority() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.reverseConfigFilePriority');
}

export function disableFileWatcher() {
  return !!workspace.getConfiguration('volar').get<boolean>('vueserver.disableFileWatcher');
}

export function diagnosticModel() {
  return workspace.getConfiguration('volar').get<'push' | 'pull'>('vueserver.diagnosticModel');
}

function additionalExtensions() {
  return workspace.getConfiguration('volar').get<string[]>('vueserver.additionalExtensions') ?? [];
}

function fullCompletionList() {
  return workspace.getConfiguration('volar').get<boolean>('vueserver.fullCompletionList');
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
    // volar
    configFilePath: workspace.getConfiguration('volar').get<string>('vueserver.configFilePath'),
    serverMode,
    diagnosticModel:
      serverMode === ServerMode.Syntactic
        ? DiagnosticModel.None
        : diagnosticModel() === 'pull'
        ? DiagnosticModel.Pull
        : DiagnosticModel.Push,
    textDocumentSync: textDocumentSync
      ? {
          incremental: TextDocumentSyncKind.Incremental,
          full: TextDocumentSyncKind.Full,
          none: TextDocumentSyncKind.None,
        }[textDocumentSync]
      : TextDocumentSyncKind.Incremental,
    typescript: resolveCurrentTsPaths,
    noProjectReferences: noProjectReferences(),
    reverseConfigFilePriority: reverseConfigFilePriority(),
    disableFileWatcher: disableFileWatcher(),
    maxFileSize: workspace.getConfiguration('volar').get<number>('vueserver.maxFileSize'),
    // vue
    petiteVue: {
      processHtmlFile: processHtml(),
    },
    vitePress: {
      processMdFile: processMd(),
    },
    additionalExtensions: additionalExtensions(),
    fullCompletionList: fullCompletionList(),
  };
  return initializationOptions;
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
