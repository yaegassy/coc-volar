import { ExtensionContext, LanguageClient, commands } from 'coc.nvim';
import * as shared from '@volar/shared';

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
