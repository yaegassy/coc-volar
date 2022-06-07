import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';
import { VerifyAllScriptsNotificationType } from '../requestTypes';

export async function register(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  context.subscriptions.push(
    commands.registerCommand('volar.action.verifyAllScripts', () => {
      languageClient.sendNotification(VerifyAllScriptsNotificationType);
    })
  );
}
