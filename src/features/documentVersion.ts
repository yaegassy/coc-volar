import { ExtensionContext, workspace } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  context.subscriptions.push(
    languageClient.onRequest(shared.GetDocumentVersionRequest.type, (handler) => {
      const doc = workspace.textDocuments.find((doc) => doc.uri.toString() === handler.uri);
      return doc?.version;
    })
  );
}
