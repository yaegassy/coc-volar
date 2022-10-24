import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';
import { ReportStatsType } from '../requestTypes';

export async function register(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand('volar.action.serverStats', async () => {
      await client.sendNotification(ReportStatsType.method, {});
      //await commands.executeCommand('workbench.action.output.toggleOutput');
      client.outputChannel.show();
    })
  );
}
