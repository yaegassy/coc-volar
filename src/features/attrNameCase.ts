/**
 * MEMO: Minimum porting for "completion" to work.
 */

import { ExtensionContext, workspace } from 'coc.nvim';
import { LanguageClient } from 'vscode-languageclient/node';
import * as shared from '@volar/shared';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  while ((await languageClient.sendRequest(shared.PingRequest.type)) !== 'pong') {
    await shared.sleep(100);
  }

  const attrCases = new shared.UriMap<'kebabCase' | 'pascalCase'>();

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((doc) => {
      attrCases.delete(doc.uri.toString());
    })
  );

  return (uri: string) => {
    const attrCase = attrCases.get(uri);
    return attrCase ?? 'kebabCase';
  };
}
