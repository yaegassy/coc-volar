import { commands, ExtensionContext, Uri, workspace, window } from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('volar.action.createWorkspaceSnippets', async () => {
      if (workspace.workspaceFolders) {
        for (const rootPath of workspace.workspaceFolders) {
          const templatePath = path.join(context.extensionPath, 'templates', 'vue.code-snippets');
          // TODO: from .vscode to .vim ?
          const newTemplatePath = path.join(Uri.parse(rootPath.uri).fsPath, '.vscode', 'vue.code-snippets');

          if (!fs.existsSync(newTemplatePath)) {
            const template = fs.readFileSync(templatePath);
            fs.mkdirSync(path.dirname(newTemplatePath)); // <--- MEMO: Add
            fs.writeFileSync(newTemplatePath, template);
          }
          const document = await workspace.readFile(templatePath);
          await window.echoLines(document.split('\n'));
        }
      }
    })
  );
}
