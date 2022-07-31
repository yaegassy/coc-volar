import { commands, ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import { ReloadProjectNotificationType } from '../requestTypes';

export async function register(cmd: string, context: ExtensionContext, languageClients: LanguageClient[]) {
  context.subscriptions.push(
    commands.registerCommand(cmd, async () => {
      const { document } = await workspace.getCurrentState();
      for (const client of languageClients) {
        client.sendNotification(ReloadProjectNotificationType, {
          uri: document.uri,
        });
      }
    })
  );
}
