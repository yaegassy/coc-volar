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
