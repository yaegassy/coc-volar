import { commands, ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import { ReloadProjectNotificationType } from '../requestTypes';

export async function register(cmd: string, context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(cmd, async () => {
      const { document } = await workspace.getCurrentState();
      client.sendNotification(ReloadProjectNotificationType, {
        uri: document.uri,
      });
    }),
  );
}
