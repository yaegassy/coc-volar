import { commands, ExtensionContext, Uri, window, workspace } from 'coc.nvim';
import * as path from 'path';
import * as fs from 'fs';

export async function activate(context: ExtensionContext) {
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

      const extVueTscDepPackageJsonPath = path.join(
        context.extensionPath,
        'node_modules',
        'vscode-vue-languageservice',
        'package.json'
      );

      if (fs.existsSync(depPath) && fs.existsSync(extVueTscDepPackageJsonPath)) {
        try {
          const packageJsonText = fs.readFileSync(depPath, 'utf8');
          const packageJson = JSON.parse(packageJsonText);
          const depVersion = packageJson.version;

          const extVueTscDepPackageJsonText = fs.readFileSync(extVueTscDepPackageJsonPath, 'utf8');
          const extVueTscDepPackageJson = JSON.parse(extVueTscDepPackageJsonText);
          const extVueTscDepVersion = extVueTscDepPackageJson.version;

          if (depVersion && depVersion !== extVueTscDepVersion) {
            const message = `vue-tsc dependency version (${depVersion}) is different to Extension version (${extVueTscDepVersion}). Type-checking behavior maybe different.`;
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
