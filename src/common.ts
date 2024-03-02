import {
  DocumentFilter,
  ExtensionContext,
  LanguageClient,
  OutputChannel,
  Thenable,
  commands,
  window,
  workspace,
} from 'coc.nvim';

import { DiagnosticModel, ServerMode, VueServerInitializationOptions } from '@vue/language-server';

import * as doctor from './client/commands/doctor';
import * as initializeTakeOverMode from './client/commands/initializeTakeOverMode';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
import * as statusBar from './client/statusBar';
import * as autoInsertion from './features/autoInsertion';
import * as fileReferences from './features/fileReferences';
import * as reloadProject from './features/reloadProject';
import * as tsVersion from './features/tsVersion';

import { config } from './config';

let semanticClient: LanguageClient;
let syntacticClient: LanguageClient;

type CreateLanguageClient = (
  id: string,
  name: string,
  langs: DocumentFilter[],
  initOptions: VueServerInitializationOptions,
  port: number,
  outputChannel: OutputChannel,
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
      (!activated && currentLangId === 'markdown' && config.server.vitePress.supportMdFile) ||
      (!activated && currentLangId === 'html' && config.server.petiteVue.supportHtmlFile)
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
        (!activated && currentlangId === 'markdown' && config.server.vitePress.supportMdFile) ||
        (!activated && currentlangId === 'html' && config.server.petiteVue.supportHtmlFile)
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
    context.subscriptions,
  );
}

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient) {
  initializeWorkspaceState(context);

  const semanticOutputChannel = window.createOutputChannel('Vue Semantic Server');
  const syntacticOutputChannel = window.createOutputChannel('Vue Syntactic Server');

  [semanticClient, syntacticClient] = await Promise.all([
    createLc(
      'vue-semantic-server',
      'Vue Semantic Server',
      getDocumentSelector(context, ServerMode.PartialSemantic),
      await getInitializationOptions(ServerMode.PartialSemantic, context),
      6009,
      semanticOutputChannel,
    ),
    createLc(
      'vue-syntactic-server',
      'Vue Syntactic Server',
      getDocumentSelector(context, ServerMode.Syntactic),
      await getInitializationOptions(ServerMode.Syntactic, context),
      6011,
      syntacticOutputChannel,
    ),
  ]);
  const clients = [semanticClient, syntacticClient];

  registerRestartRequest();

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
      workspace.getConfiguration('vue').get<boolean>('autoInsert.dotValue')
    ) {
      autoInsertion.register(context, syntacticClient, semanticClient);
    }
  }

  async function registerRestartRequest() {
    await Promise.all(clients.map((client) => client.onReady()));

    context.subscriptions.push(
      commands.registerCommand('volar.action.restartServer', async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await Promise.all(clients.map((client) => client.start()));
      }),
    );
  }
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([semanticClient?.stop(), syntacticClient?.stop()]);
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getDocumentSelector(_context: ExtensionContext, serverMode: ServerMode): DocumentFilter[] {
  const takeOverMode = takeOverModeEnabled();
  const selectors: DocumentFilter[] = [];
  selectors.push({ language: 'vue' });
  if (takeOverMode) {
    selectors.push({ language: 'javascript' });
    selectors.push({ language: 'typescript' });
    selectors.push({ language: 'javascriptreact' });
    selectors.push({ language: 'typescriptreact' });
    if (serverMode === ServerMode.Semantic || serverMode === ServerMode.PartialSemantic) {
      // support find references for .json files
      selectors.push({ language: 'json' });
    }
  }

  if (config.server.petiteVue.supportHtmlFile) {
    selectors.push({ language: 'html' });
  }
  if (config.server.vitePress.supportMdFile) {
    selectors.push({ language: 'markdown' });
  }

  return selectors;
}

async function getInitializationOptions(
  serverMode: ServerMode,
  context: ExtensionContext,
  options: VueServerInitializationOptions = {},
) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-tsdk-path', resolveCurrentTsPaths.tsdk);
  }

  // volar
  options.serverMode = serverMode;
  options.diagnosticModel = config.server.diagnosticModel === 'pull' ? DiagnosticModel.Pull : DiagnosticModel.Push;
  options.typescript = resolveCurrentTsPaths;
  options.maxFileSize = config.server.maxFileSize;
  options.semanticTokensLegend = {
    tokenTypes: ['component'],
    tokenModifiers: [],
  };
  options.additionalExtensions = [
    ...config.server.additionalExtensions,
    ...(!config.server.petiteVue.supportHtmlFile ? [] : ['html']),
    ...(!config.server.vitePress.supportMdFile ? [] : ['md']),
  ];

  return options;
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-tsdk-path', undefined);
}
