import { commands, ExtensionContext, Uri, window, workspace } from 'coc.nvim';
import * as path from 'path';
import * as fs from 'fs';

export async function activate(context: ExtensionContext) {
  if (!workspace.getConfiguration('volar').get<boolean>('checkVueTscVersion')) return;

  if (workspace.workspaceFolders) {
    for (const folder of workspace.workspaceFolders) {
      // MEMO: pnpm related
      const pnpmPackagesDirNames = getDirectoryItemNames(
        path.join(Uri.parse(folder.uri).fsPath, 'node_modules', '.pnpm')
      );

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

      try {
        let vueTscVueLsVersion: string | undefined;
        let extVueTscVueLsVersion: string | undefined;

        // npm, yarn
        if (fs.existsSync(vueTscVueLsPackageJsonPath)) {
          const vueTscVueLsPackageJsonText = fs.readFileSync(vueTscVueLsPackageJsonPath, 'utf8');
          const vueTscVueLsPackageJson = JSON.parse(vueTscVueLsPackageJsonText);
          vueTscVueLsVersion = vueTscVueLsPackageJson.version;
        }
        // pnpm
        if (!vueTscVueLsVersion) {
          vueTscVueLsVersion = getPackageVersionFromDirectoryName(
            pnpmPackagesDirNames,
            /^vscode-vue-languageservice@.*$/
          );
        }

        if (fs.existsSync(extVueTscVueLsPackageJsonPath)) {
          const extVueTscVueLsPackageJsonText = fs.readFileSync(extVueTscVueLsPackageJsonPath, 'utf8');
          const extVueTscVueLsPackageJson = JSON.parse(extVueTscVueLsPackageJsonText);
          extVueTscVueLsVersion = extVueTscVueLsPackageJson.version;
        }

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

function getDirectoryItemNames(dirPath: string): string[] | undefined {
  let a: string[] | undefined = [];
  try {
    a = fs.readdirSync(dirPath);
  } catch {
    return undefined;
  }
  return a;
}

function getPackageVersionFromDirectoryName(items: string[] | undefined, regex: RegExp) {
  let r: string | undefined;
  if (items) {
    items.forEach((v) => {
      const m = v.match(regex);
      if (m) {
        v = v.replace(/^@/, '');
        r = v.split('@')[1];
      }
    });
  }
  return r;
}
