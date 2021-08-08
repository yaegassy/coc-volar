import { ExtensionContext, Uri, workspace } from 'coc.nvim';
import path from 'path';
import * as shared from '@volar/shared';

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
    const tsPath = shared.getWorkspaceTypescriptPath(
      tsdk,
      workspace.workspaceFolders.map((folder) => Uri.parse(folder.uri).fsPath)
    );
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
