import { ExtensionContext, Uri, window, workspace } from 'coc.nvim';
import path from 'path';
import fs from 'fs';

export function versionCommand(context: ExtensionContext) {
  const clientJSON = path.join(context.extensionPath, 'package.json');
  const clientPackage = JSON.parse(fs.readFileSync(clientJSON, 'utf8'));
  const serverJSON = path.join(context.extensionPath, 'node_modules', '@volar', 'server', 'package.json');
  const serverPackage = JSON.parse(fs.readFileSync(serverJSON, 'utf8'));
  window.showMessage(`coc-volar(client) v${clientPackage.version} with volar(server) v${serverPackage.version}`);
}

export function doctorCommand(context: ExtensionContext) {
  return async () => {
    const { document } = await workspace.getCurrentState();
    const filePath = Uri.parse(document.uri).fsPath;

    if (!filePath.endsWith('.vue')) {
      return window.showInformationMessage('Failed to doctor. Make sure the current file is a .vue file.');
    }

    const clientJSON = path.join(context.extensionPath, 'package.json');
    const clientPackage = JSON.parse(fs.readFileSync(clientJSON, 'utf8'));
    const serverJSON = path.join(context.extensionPath, 'node_modules', '@volar', 'server', 'package.json');
    const serverPackage = JSON.parse(fs.readFileSync(serverJSON, 'utf8'));

    let vueVersion: string | undefined;
    let vueRuntimeDomVersion: string | undefined;
    let vueTscDepVersion: string | undefined;
    let vueTscExtVersion: string | undefined;

    if (workspace.workspaceFolders) {
      for (const folder of workspace.workspaceFolders) {
        const vuePackageJsonPath = path.join(Uri.parse(folder.uri).fsPath, 'node_modules', 'vue', 'package.json');

        const vueRuntimeDomPackageJsonPath = path.join(
          Uri.parse(folder.uri).fsPath,
          'node_modules',
          '@vue',
          'runtime-dom',
          'package.json'
        );

        const vueTscDepPackageJsonPath = path.join(
          Uri.parse(folder.uri).fsPath,
          'node_modules',
          'vscode-vue-languageservice',
          'package.json'
        );

        const vueTscExtPackageJsonPath = path.join(
          context.extensionPath,
          'node_modules',
          'vscode-vue-languageservice',
          'package.json'
        );

        if (fs.existsSync(vuePackageJsonPath)) {
          vueVersion = getPackageVersion(vuePackageJsonPath);
        }

        if (fs.existsSync(vueRuntimeDomPackageJsonPath)) {
          vueRuntimeDomVersion = getPackageVersion(vueRuntimeDomPackageJsonPath);
        }

        if (fs.existsSync(vueTscDepPackageJsonPath)) {
          vueTscDepVersion = getPackageVersion(vueTscDepPackageJsonPath);
        }

        if (fs.existsSync(vueTscExtPackageJsonPath)) {
          vueTscExtVersion = getPackageVersion(vueTscExtPackageJsonPath);
        }
      }
    }

    let tsVersion: string | undefined;
    const tsServerPath = context.workspaceState.get<string>('coc-volar-ts-server-path');
    if (tsServerPath) {
      const typescriptPackageJsonPath = path.join(path.resolve(path.dirname(tsServerPath), '..'), 'package.json');
      if (fs.existsSync(typescriptPackageJsonPath)) {
        tsVersion = getPackageVersion(typescriptPackageJsonPath);
      }
    }

    const doctorData = {
      name: 'Volar doctor info',
      filePath,
      clientVersion: clientPackage.version,
      serverVersion: serverPackage.version,
      vueVersion: vueVersion === undefined ? 'none' : vueVersion,
      vueRuntimeDomVersion: vueRuntimeDomVersion === undefined ? 'none' : vueRuntimeDomVersion,
      vueTscDepVersion: vueTscDepVersion === undefined ? 'none' : vueTscDepVersion,
      vueTscExtVersion: vueTscExtVersion,
      tsVersion,
      tsServerPath,
      settings: workspace.getConfiguration('volar'),
    };

    const outputText = JSON.stringify(doctorData, null, 2);

    await workspace.nvim
      .command('belowright vnew volar-doctor | setlocal buftype=nofile bufhidden=hide noswapfile filetype=json')
      .then(async () => {
        const buf = await workspace.nvim.buffer;
        buf.setLines(outputText.split('\n'), { start: 0, end: -1 });
      });
  };
}

function getPackageVersion(packageJsonPath: string): string | undefined {
  let version: string | undefined;
  try {
    const packageJsonText = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonText);
    version = packageJson.version;
  } catch {}
  return version;
}
