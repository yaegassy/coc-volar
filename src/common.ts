import { commands, DocumentFilter, ExtensionContext, LanguageClient, Thenable, workspace } from 'coc.nvim';

import { DiagnosticModel, ServerMode, VueServerInitializationOptions } from '@volar/vue-language-server';

import * as doctor from './client/commands/doctor';
import * as initializeTakeOverMode from './client/commands/initializeTakeOverMode';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
import * as statusBar from './client/statusBar';
import * as autoInsertion from './features/autoInsertion';
import * as componentMeta from './features/componentMeta';
import * as fileReferences from './features/fileReferences';
import * as reloadProject from './features/reloadProject';
import * as serverStatus from './features/serverStatus';
import * as tsVersion from './features/tsVersion';
import * as virtualFiles from './features/virtualFiles';

import { config } from './config';

let semanticClient: LanguageClient;
let syntacticClient: LanguageClient;

type CreateLanguageClient = (
  id: string,
  name: string,
  langs: DocumentFilter[],
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
      (!activated && currentLangId === 'markdown' && config.vueserver.vitePress.processMdFile) ||
      (!activated && currentLangId === 'html' && config.vueserver.petiteVue.processHtmlFile)
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
        (!activated && currentlangId === 'markdown' && config.vueserver.vitePress.processMdFile) ||
        (!activated && currentlangId === 'html' && config.vueserver.petiteVue.processHtmlFile)
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
      getDocumentSelector(context, ServerMode.PartialSemantic),
      await getInitializationOptions(ServerMode.PartialSemantic, context),
      6009
    ),
    createLc(
      'vue-syntactic-server',
      'Vue Syntactic Server',
      getDocumentSelector(context, ServerMode.Syntactic),
      await getInitializationOptions(ServerMode.Syntactic, context),
      6011
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
      workspace.getConfiguration('vue').get<boolean>('features.autoInsert.dotValue')
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
      })
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
      // support document links for tsconfig.json
      selectors.push({ language: 'jsonc', pattern: '**/[jt]sconfig.json' });
      selectors.push({ language: 'jsonc', pattern: '**/[jt]sconfig.*.json' });
    }
  }

  if (config.vueserver.petiteVue.processHtmlFile) {
    selectors.push({ language: 'html' });
  }
  if (config.vueserver.vitePress.processMdFile) {
    selectors.push({ language: 'markdown' });
  }

  return selectors;
}

export function diagnosticModel() {
  return workspace.getConfiguration('volar').get<'push' | 'pull'>('vueserver.diagnosticModel');
}

async function getInitializationOptions(serverMode: ServerMode, context: ExtensionContext) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-ts-server-path', resolveCurrentTsPaths.tsdk);
  }

  const initializationOptions: VueServerInitializationOptions = {
    // volar
    configFilePath: config.vueserver.configFilePath,
    serverMode,
    diagnosticModel: config.vueserver.diagnosticModel === 'pull' ? DiagnosticModel.Pull : DiagnosticModel.Push,
    typescript: resolveCurrentTsPaths,
    reverseConfigFilePriority: config.vueserver.reverseConfigFilePriority,
    maxFileSize: config.vueserver.maxFileSize,
    fullCompletionList: config.vueserver.fullCompletionList,
    // vue
    petiteVue: {
      processHtmlFile: !!config.vueserver.petiteVue.processHtmlFile,
    },
    vitePress: {
      processMdFile: !!config.vueserver.vitePress.processMdFile,
    },
    additionalExtensions: config.vueserver.additionalExtensions,
  };
  return initializationOptions;
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-ts-server-path', undefined);
}
