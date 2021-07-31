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

  const tagCases = new shared.UriMap<'both' | 'kebabCase' | 'pascalCase' | 'unsure'>();

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((doc) => {
      tagCases.delete(doc.uri.toString());
    })
  );

  return (uri: string) => {
    const tagCase = tagCases.get(uri);
    return !tagCase || tagCase === 'unsure' ? 'both' : tagCase;
  };
}
