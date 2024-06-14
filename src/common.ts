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

import { VueInitializationOptions } from '@vue/language-server';

import * as doctor from './client/commands/doctor';
import * as scaffoldSnippets from './client/completions/scaffoldSnippets';
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

export const enabledHybridMode = config.server.hybridMode;

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient) {
  initializeWorkspaceState(context);

  const outputChannel = window.createOutputChannel('Vue Language Server');
  client = createLc(
    'vue',
    'Vue',
    getDocumentSelector(),
    await getInitializationOptions(context, enabledHybridMode),
    6009,
    outputChannel,
  );

  activateRestartRequest();

  /** Custom commands for coc-volar */
  doctor.register(context);
  /** Custom snippets completion for coc-volar */
  scaffoldSnippets.register(context);

  async function activateRestartRequest() {
    context.subscriptions.push(
      commands.registerCommand('vue.action.restartServer', async () => {
        await client.stop();

        outputChannel.clear();

        client.clientOptions.initializationOptions = await getInitializationOptions(context, enabledHybridMode);

        await client.start();
      }),
    );
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

async function getInitializationOptions(
  context: ExtensionContext,
  hybridMode: boolean,
): Promise<VueInitializationOptions> {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-tsdk-path', resolveCurrentTsPaths.tsdk);
  }

  return {
    typescript: resolveCurrentTsPaths,
    vue: {
      hybridMode,
    },
  };
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-tsdk-path', undefined);
}
