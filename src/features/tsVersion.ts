import { ExtensionContext, Uri, workspace, WorkspaceFolder } from 'coc.nvim';
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

  const builtinTsPaths = {
    serverPath: path.join(context.extensionPath, 'node_modules', 'typescript', 'lib', 'typescript.js'),
    localizedPath: undefined,
  };

  return { ...builtinTsPaths, isWorkspacePath: false };
}

function getWorkspaceTsPaths(useDefault = false) {
  let tsdk = getTsdk();
  if (!tsdk && useDefault) {
    tsdk = defaultTsdk;
  }
  if (tsdk) {
    const tsPath = getWorkspaceTypescriptPath(tsdk, workspace.workspaceFolders);
    if (tsPath) {
      return {
        serverPath: tsPath,
        localizedPath: undefined,
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
  const volarExtensionConfig = workspace.getConfiguration('volar');
  return volarExtensionConfig.get<boolean>('useWorkspaceTsdk', false);
}

/**
 * Ported from volar/packages/shared/src/ts.ts for coc.nvim
 */
function getWorkspaceTypescriptPath(tsdk: string, workspaceFolderFsPaths: readonly WorkspaceFolder[]) {
  if (path.isAbsolute(tsdk)) {
    const tsPath = findTypescriptModulePathInLib(tsdk);
    if (tsPath) {
      return tsPath;
    }
  } else {
    for (const folder of workspaceFolderFsPaths) {
      /**
       * MEMO: WorkspaceFolder[].folder -> folder.uri for coc.nvim
       * MEMO: file schema path to real path for coc.nvim
       */
      const tsPath = findTypescriptModulePathInLib(path.join(Uri.parse(folder.uri).fsPath, tsdk));
      if (tsPath) {
        return tsPath;
      }
    }
  }
}

/**
 * Ported from volar/packages/shared/src/ts.ts for coc.nvim
 */
function findTypescriptModulePathInLib(lib: string) {
  const tsserverlibrary = path.join(lib, 'tsserverlibrary.js');
  const typescript = path.join(lib, 'typescript.js');
  const tsserver = path.join(lib, 'tsserver.js');

  if (fs.existsSync(tsserverlibrary)) {
    return tsserverlibrary;
  }
  if (fs.existsSync(typescript)) {
    return typescript;
  }
  if (fs.existsSync(tsserver)) {
    return tsserver;
  }
}
