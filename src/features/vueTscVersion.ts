import { commands, ExtensionContext, OutputChannel, Uri, window, workspace } from 'coc.nvim';
import * as path from 'path';
import * as fs from 'fs';

export async function activate(context: ExtensionContext, outputChannel: OutputChannel) {
  if (!workspace.getConfiguration('volar').get<boolean>('checkVueTscVersion')) return;

  if (workspace.workspaceFolders) {
    for (const folder of workspace.workspaceFolders) {
      // MEMO: Uri.parse(folder.uri).fsPath for coc.nvim
      const depPath = path.join(
        Uri.parse(folder.uri).fsPath,
        'node_modules',
        'vscode-vue-languageservice',
        'package.json'
      );

      const extVueTscPackageJsonPath = path.join(
        context.extensionPath,
        'node_modules',
        'vscode-vue-languageservice',
        'package.json'
      );

      if (fs.existsSync(depPath) && fs.existsSync(extVueTscPackageJsonPath)) {
        try {
          const packageJsonText = fs.readFileSync(depPath, 'utf8');
          const packageJson = JSON.parse(packageJsonText);
          const depVersion = packageJson.version;

          const extVueTscPackageJsonText = fs.readFileSync(extVueTscPackageJsonPath, 'utf8');
          const extVueTscPackageJson = JSON.parse(extVueTscPackageJsonText);
          const extVueTscVersion = extVueTscPackageJson.version;

          // MEMO: logging for coc-volar (volar-client)
          outputChannel.appendLine(`VueTsc(dep) Version | Path: ${depVersion} | ${depPath}`);
          outputChannel.appendLine(`VueTsc(ext) Version | Path: ${extVueTscVersion} | ${extVueTscPackageJsonPath}`);

          if (depVersion && depVersion !== extVueTscVersion) {
            const message = `vue-tsc dependency version (${depVersion}) is different to Extension version (${extVueTscVersion}). Type-checking behavior maybe different.`;
            const howTo = 'How To Update?';
            const disable = 'Disable Version Checking';

            const option = await window.showInformationMessage(message, howTo, disable);

            if (option === howTo) {
              // In coc-volar, use vscode.open
              commands.executeCommand('vscode.open', ['https://github.com/johnsoncodehk/volar/discussions/402']);
            }
            if (option === disable) {
              await workspace.nvim.command(`CocRestart`, true);
              const config = workspace.getConfiguration('volar');
              config.update('checkVueTscVersion', false);
            }
          }
        } catch {}
      }
    }
  }
}
