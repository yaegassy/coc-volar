import { commands, ExtensionContext, Uri, window, workspace } from 'coc.nvim';
import * as path from 'path';
import * as fs from 'fs';

export async function activate(context: ExtensionContext) {
  if (!workspace.getConfiguration('volar').get<boolean>('checkVueTscVersion')) return;

  if (workspace.workspaceFolders) {
    for (const folder of workspace.workspaceFolders) {
      // MEMO: Uri.parse(folder.uri).fsPath for coc.nvim
      const vueTscVueLsPackageJsonPath = path.join(
        Uri.parse(folder.uri).fsPath,
        'node_modules',
        'vscode-vue-languageservice',
        'package.json'
      );

      const extVueTscVueLsPackageJsonPath = path.join(
        context.extensionPath,
        'node_modules',
        'vscode-vue-languageservice',
        'package.json'
      );

      if (fs.existsSync(vueTscVueLsPackageJsonPath) && fs.existsSync(extVueTscVueLsPackageJsonPath)) {
        try {
          const vueTscVueLsPackageJsonText = fs.readFileSync(vueTscVueLsPackageJsonPath, 'utf8');
          const vueTscVueLsPackageJson = JSON.parse(vueTscVueLsPackageJsonText);
          const vueTscVueLsVersion = vueTscVueLsPackageJson.version;

          const extVueTscVueLsPackageJsonText = fs.readFileSync(extVueTscVueLsPackageJsonPath, 'utf8');
          const extVueTscVueLsPackageJson = JSON.parse(extVueTscVueLsPackageJsonText);
          const extVueTscVueLsVersion = extVueTscVueLsPackageJson.version;

          if (vueTscVueLsVersion && vueTscVueLsVersion !== extVueTscVueLsVersion) {
            const message = `vue-tsc's dependency version (${vueTscVueLsVersion}) is different to Extension version (${extVueTscVueLsVersion}). Type-checking behavior maybe different.`;
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
