/**
 * TODO: Project-level typyscript module detection for coc.nvim
 * TODO: Clean up...
 */

import { ExtensionContext, workspace, LanguageClient } from 'coc.nvim';
import * as shared from '@volar/shared';
import path from 'path';

const defaultTsdk = 'node_modules/typescript/lib';

export async function activate(context: ExtensionContext, client: LanguageClient) {
  // TODO
}

export function getCurrentTsPaths(context: ExtensionContext) {
  if (isUseWorkspaceTsdk(context)) {
    const workspaceTsPaths = getWorkspaceTsPaths(true);
    if (workspaceTsPaths) {
      return { ...workspaceTsPaths, isWorkspacePath: true };
    }
  }

  const builtinTsPaths = {
    // MEMO: To use from coc.nvim, specify even the module name 'typescript.js'
    //serverPath: path.join(context.extensionPath, 'node_modules', 'typescript', 'lib'),
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
    const tsPath = shared.getWorkspaceTypescriptPath(tsdk, workspace.workspaceFolders);
    if (tsPath) {
      return {
        serverPath: tsPath,
        localizedPath: shared.getWorkspaceTypescriptLocalizedPath(
          tsdk,
          'en', // vscode.env.language,
          workspace.workspaceFolders
        ),
      };
    }
  }
}

function getTsdk() {
  const tsConfigs = workspace.getConfiguration('typescript');
  const tsdk = tsConfigs.get<string>('tsdk');
  return tsdk;
}

function isUseWorkspaceTsdk(context: ExtensionContext) {
  const volarExtensionConfig = workspace.getConfiguration('volar');
  return volarExtensionConfig.get<boolean>('useWorkspaceTsdk', false);
}
