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

import { DiagnosticModel, VueInitializationOptions } from '@vue/language-server';

import * as doctor from './client/commands/doctor';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
import * as autoInsertion from './features/autoInsertion';
import * as reloadProject from './features/reloadProject';
import * as tsVersion from './features/tsVersion';

import { config } from './config';

let client: LanguageClient;

type CreateLanguageClient = (
  id: string,
  name: string,
  langs: DocumentFilter[],
  initOptions: VueInitializationOptions,
  port: number,
  outputChannel: OutputChannel,
) => LanguageClient;

let resolveCurrentTsPaths: {
  tsdk: string;
  isWorkspacePath: boolean;
};

let activated: boolean;

export async function activate(context: ExtensionContext, createLc: CreateLanguageClient) {
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
    },
    null,
    context.subscriptions,
  );
}

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient) {
  initializeWorkspaceState(context);

  const outputChannel = window.createOutputChannel('Vue Language Server');
  client = createLc('vue', 'Vue', getDocumentSelector(), await getInitializationOptions(context), 6009, outputChannel);

  activateRestartRequest();
  activateClientRequests();

  reloadProject.register('vue.action.reloadProject', context, client);
  /** Custom commands for coc-volar */
  doctor.register(context);
  /** Custom snippets completion for coc-volar */
  scaffoldSnippets.register(context);

  const selectors: DocumentFilter[] = [{ language: 'vue' }];

  if (client) {
    if (
      workspace.getConfiguration('volar').get<boolean>('autoCreateQuotes') ||
      workspace.getConfiguration('volar').get<boolean>('autoClosingTags') ||
      workspace.getConfiguration('vue').get<boolean>('autoInsert.dotValue')
    ) {
      autoInsertion.activate(selectors, client);
    }
  }

  async function activateRestartRequest() {
    context.subscriptions.push(
      commands.registerCommand('vue.action.restartServer', async () => {
        await client.stop();

        outputChannel.clear();

        client.clientOptions.initializationOptions = await getInitializationOptions(context);

        await client.start();

        activateClientRequests();
      }),
    );
  }

  function activateClientRequests() {
    //nameCasing.activate(context, client);
  }
}

export function deactivate(): Thenable<any> | undefined {
  return client?.stop();
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getDocumentSelector(): DocumentFilter[] {
  const selectors: DocumentFilter[] = [];
  selectors.push({ language: 'vue' });

  return selectors;
}

async function getInitializationOptions(context: ExtensionContext): Promise<VueInitializationOptions> {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-tsdk-path', resolveCurrentTsPaths.tsdk);
  }

  return {
    // volar
    diagnosticModel: config.server.diagnosticModel === 'pull' ? DiagnosticModel.Pull : DiagnosticModel.Push,
    typescript: resolveCurrentTsPaths,
    maxFileSize: config.server.maxFileSize,
    semanticTokensLegend: {
      tokenTypes: ['component'],
      tokenModifiers: [],
    },
    vue: {
      additionalExtensions: [...config.server.additionalExtensions],
    },
  };
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-tsdk-path', undefined);
}
