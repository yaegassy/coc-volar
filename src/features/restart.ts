import { ExtensionContext, commands, LanguageClient } from 'coc.nvim';
import { RestartServerNotificationType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClients: LanguageClient[]) {
  for (const languageClient of languageClients) {
    await languageClient.onReady();
  }

  context.subscriptions.push(
    commands.registerCommand('volar.action.restartServer', () => {
      for (const languageClient of languageClients) {
        languageClient.sendNotification(RestartServerNotificationType, undefined);
      }
    })
  );
}
