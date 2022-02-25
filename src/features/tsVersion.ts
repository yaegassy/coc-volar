import { ExtensionContext, Uri, workspace } from 'coc.nvim';
import path from 'path';
import fs from 'fs';

const defaultTsdk = 'node_modules/typescript/lib';

export function getCurrentTsPaths(context: ExtensionContext) {
  if (getConfigUseWorkspaceTsdk()) {
    const workspaceTsPaths = getWorkspaceTsPaths(true);
    if (workspaceTsPaths) {
      return { ...workspaceTsPaths, isWorkspacePath: true };
    }
  }

  const tsLocalizedLang = getConfigDiagnosticsTsLocale();
  const tsLocaleJsonPath = path.join(
    context.extensionPath,
    'node_modules',
    'typescript',
    'lib',
    tsLocalizedLang,
    'diagnosticMessages.generated.json'
  );
  const localizedPath = fs.existsSync(tsLocaleJsonPath) ? tsLocaleJsonPath : undefined;

  const builtinTsPaths = {
    serverPath: path.join(context.extensionPath, 'node_modules', 'typescript', 'lib', 'tsserverlibrary.js'),
    localizedPath,
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
      const tsLocalizedLang = getConfigDiagnosticsTsLocale();
      const tsLocaleJsonPath = path.join(path.dirname(tsPath), tsLocalizedLang, 'diagnosticMessages.generated.json');
      const localizedPath = fs.existsSync(tsLocaleJsonPath) ? tsLocaleJsonPath : undefined;

      return {
        serverPath: tsPath,
        localizedPath,
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

// Memo: volar.useWorkspaceTsdk for coc-volar
function getConfigUseWorkspaceTsdk() {
  return workspace.getConfiguration('volar').get<boolean>('useWorkspaceTsdk', false);
}

// Memo: volar.diagnostics.tsLocale for coc-volar
function getConfigDiagnosticsTsLocale() {
  return workspace.getConfiguration('volar').get<string>('diagnostics.tsLocale', 'en');
}

// Memo: tsserver.tsdk for coc-tsserver
function getConfigCocTsserverTsdk() {
  return workspace.getConfiguration('tsserver').get<string>('tsdk');
}
