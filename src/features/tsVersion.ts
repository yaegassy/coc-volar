import { ExtensionContext, Uri, workspace } from 'coc.nvim';
import * as shared from '@volar/shared';
import path from 'path';
import fs from 'fs';

const defaultTsdk = 'node_modules/typescript/lib';

export function getCurrentTsPaths(context: ExtensionContext) {
  if (isUseWorkspaceTsdk()) {
    const workspaceTsPaths = getWorkspaceTsPaths(true);
    if (workspaceTsPaths) {
      return { ...workspaceTsPaths, isWorkspacePath: true };
    }
  }

  const tsLocale = getTsLocale();
  const tsLocalJsonPath = path.join(
    context.extensionPath,
    'node_modules',
    'typescript',
    'lib',
    tsLocale,
    'diagnosticMessages.generated.json'
  );

  const localizedPath = fs.existsSync(tsLocalJsonPath) ? tsLocalJsonPath : undefined;

  const builtinTsPaths = {
    serverPath: path.join(context.extensionPath, 'node_modules', 'typescript', 'lib', 'typescript.js'),
    localizedPath,
  };

  return { ...builtinTsPaths, isWorkspacePath: false };
}

function getWorkspaceTsPaths(useDefault = false) {
  let tsdk = getTsdk();
  if (!tsdk && useDefault) {
    tsdk = defaultTsdk;
  }
  if (tsdk) {
    const tsPath = shared.getWorkspaceTypescriptPath(
      tsdk,
      workspace.workspaceFolders.map((folder) => Uri.parse(folder.uri).fsPath)
    );
    if (tsPath) {
      const tsLocale = getTsLocale();
      const tsLocaleJsonPath = path.join(path.dirname(tsPath), tsLocale, 'diagnosticMessages.generated.json');
      const localizedPath = fs.existsSync(tsLocaleJsonPath) ? tsLocaleJsonPath : undefined;

      return {
        serverPath: tsPath,
        localizedPath,
      };
    }
  }
}

function getTsdk() {
  // MEMO: tsserver.tsdk for coc-tsserver
  const tsConfigs = workspace.getConfiguration('tsserver');
  const tsdk = tsConfigs.get<string>('tsdk');
  return tsdk;
}

function isUseWorkspaceTsdk() {
  // MEMO: volar.useWorkspaceTsdk for coc-volar
  return workspace.getConfiguration('volar').get<boolean>('useWorkspaceTsdk', false);
}

function getTsLocale() {
  // MEMO: volar.diagnostics.tsLocale for coc-volar
  return workspace.getConfiguration('volar').get<string>('diagnostics.tsLocale', 'en');
}
