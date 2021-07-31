import { ExtensionContext, commands, LanguageClient } from 'coc.nvim';
import { RestartServerNotificationType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  context.subscriptions.push(
    commands.registerCommand('volar.action.restartServer', () => {
      languageClient.sendNotification(RestartServerNotificationType, undefined);
    })
  );
}
