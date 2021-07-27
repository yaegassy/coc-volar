import { ExtensionContext, commands } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClients: LanguageClient[]) {
  for (const languageClient of languageClients) {
    await languageClient.onReady();
  }

  context.subscriptions.push(
    commands.registerCommand('volar.action.restartServer', () => {
      for (const languageClient of languageClients) {
        languageClient.sendNotification(shared.RestartServerNotification.type, undefined);
      }
    })
  );
}
