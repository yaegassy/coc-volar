import { ExtensionContext, workspace } from 'coc.nvim';
import { LanguageClient } from 'vscode-languageclient/node';
import * as shared from '@volar/shared';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  while ((await languageClient.sendRequest(shared.PingRequest.type)) !== 'pong') {
    await shared.sleep(100);
  }

  languageClient.onRequest(shared.GetClientTarNameCaseRequest.type, async (handler) => {
    // @ts-ignore
    let tagCase = tagCases.get(handler.uri);
    if (tagCase === 'unsure') {
      const templateCases = await languageClient.sendRequest(shared.GetServerNameCasesRequest.type, handler);
      if (templateCases) {
        // @ts-ignore
        tagCase = templateCases.tag;
        // @ts-ignore
        tagCases.set(handler.uri, tagCase);
      }
    }
    return !tagCase || tagCase === 'unsure' ? 'both' : tagCase;
  });

  const tagCases = new shared.UriMap<'both' | 'kebabCase' | 'pascalCase' | 'unsure'>();

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((doc) => {
      tagCases.delete(doc.uri.toString());
    })
  );
}
