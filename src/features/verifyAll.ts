import { commands, ExtensionContext } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  context.subscriptions.push(
    commands.registerCommand('volar.action.verifyAllScripts', () => {
      languageClient.sendRequest(shared.VerifyAllScriptsRequest.type, undefined);
    })
  );
}
