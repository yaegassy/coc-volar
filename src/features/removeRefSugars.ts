import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';
import { RemoveAllRefSugarsNotificationType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  context.subscriptions.push(
    commands.registerCommand('volar.action.removeRefSugars', async () => {
      languageClient.sendNotification(RemoveAllRefSugarsNotificationType);
    })
  );
}
