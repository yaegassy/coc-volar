import { events, ExtensionContext, LanguageClient, window, workspace } from 'coc.nvim';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  const statusBar = window.createStatusBarItem(99);

  updateStatusBar();

  events.on(
    'BufEnter',
    async () => {
      updateStatusBar();
    },
    null,
    context.subscriptions
  );

  async function updateStatusBar() {
    const { document } = await workspace.getCurrentState();
    if (
      workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled') &&
      ['vue', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
    ) {
      statusBar.text = 'Volar (TakeOverMode)';
      statusBar.show();
    } else if (
      workspace.getConfiguration('volar').get<boolean>('takeOverMode.enabled') &&
      workspace.getConfiguration('volar').get<boolean>('vitePressSupport.enable') &&
      ['markdown'].includes(document.languageId)
    ) {
      statusBar.text = 'Volar (TakeOverMode)';
      statusBar.show();
    } else if (
      workspace.getConfiguration('volar').get<boolean>('vitePressSupport.enable') &&
      ['markdown'].includes(document.languageId)
    ) {
      statusBar.text = 'Volar';
      statusBar.show();
    } else if (['vue'].includes(document.languageId)) {
      statusBar.text = 'Volar';
      statusBar.show();
    } else {
      statusBar.hide();
    }
  }
}
