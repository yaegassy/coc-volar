import { commands, ExtensionContext, workspace } from 'coc.nvim';

export async function register(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.initializeTakeOverMode', initializeTakeOverModeCommand()));
}

function initializeTakeOverModeCommand() {
  return async () => {
    const config = workspace.getConfiguration('volar');
    const tsserverConfig = workspace.getConfiguration('tsserver');

    config.update('takeOverMode.enabled', true);
    tsserverConfig.update('enable', false);

    workspace.nvim.command(`CocRestart`, true);
  };
}
