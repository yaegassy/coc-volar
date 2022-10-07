import { commands, ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import { VerifyAllScriptsNotificationType } from '../requestTypes';

export async function register(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  context.subscriptions.push(
    commands.registerCommand('volar.action.verifyAllScripts', async () => {
      const { document } = await workspace.getCurrentState();
      languageClient.sendNotification(VerifyAllScriptsNotificationType, { uri: document.uri });
    })
  );
}
