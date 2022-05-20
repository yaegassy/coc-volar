import { commands, ExtensionContext, window, workspace } from 'coc.nvim';

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.initializeTakeOverMode', initializeTakeOverModeCommand()));
}

function initializeTakeOverModeCommand() {
  return async () => {
    const enableTakeOverMode = await window.showPrompt('Enable Take Over Mode?');
    const config = workspace.getConfiguration('volar');
    const tsserverConfig = workspace.getConfiguration('tsserver');

    if (enableTakeOverMode) {
      config.update('takeOverMode.enabled', true);
      tsserverConfig.update('enable', false);
    } else {
      config.update('takeOverMode.enabled', false);
      tsserverConfig.update('enable', true);
    }

    workspace.nvim.command(`CocRestart`, true);
  };
}
