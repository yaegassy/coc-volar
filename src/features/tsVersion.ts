import { ExtensionContext, Uri, workspace } from 'coc.nvim';
import fs from 'fs';
import path from 'path';

const defaultTsdk = 'node_modules/typescript/lib';

export function getCurrentTsPaths(context: ExtensionContext) {
  if (getConfigUseWorkspaceTsdk()) {
    const workspaceTsPaths = getWorkspaceTsPaths(true);
    if (workspaceTsPaths) {
      return { ...workspaceTsPaths, isWorkspacePath: true };
    }
  }
  const builtinTsPaths = {
    tsdk: path.join(context.extensionPath, 'node_modules', 'typescript', 'lib'),
  };
  return { ...builtinTsPaths, isWorkspacePath: false };
}

function getWorkspaceTsPaths(useDefault = false) {
  let tsdk = getConfigCocTsserverTsdk();
  if (!tsdk && useDefault) {
    tsdk = defaultTsdk;
  }
  if (tsdk) {
    const tsPath = getWorkspaceTypescriptPath(
      tsdk,
      workspace.workspaceFolders.map((folder) => Uri.parse(folder.uri).fsPath)
    );
    if (tsPath) {
      return {
        tsdk: tsPath,
      };
    }
  }
}

function getWorkspaceTypescriptPath(tsdk: string, workspaceFolderFsPaths: string[]) {
  if (path.isAbsolute(tsdk)) {
    const tsPath = findTypescriptModulePathInLib(tsdk);
    if (tsPath) {
      return tsPath;
    }
  } else {
    for (const folder of workspaceFolderFsPaths) {
      const tsPath = findTypescriptModulePathInLib(path.join(folder, tsdk));
      if (tsPath) {
        return tsPath;
      }
    }
  }
}

function findTypescriptModulePathInLib(lib: string) {
  if (fs.existsSync(lib)) {
    return lib;
  }
}

// Memo: volar.useWorkspaceTsdk for coc-volar
function getConfigUseWorkspaceTsdk() {
  return workspace.getConfiguration('volar').get<boolean>('useWorkspaceTsdk', false);
}

// Memo: tsserver.tsdk for coc-tsserver
function getConfigCocTsserverTsdk() {
  return workspace.getConfiguration('tsserver').get<string>('tsdk');
}
