import { ExtensionContext, workspace, LanguageClient } from 'coc.nvim';
import { GetDocumentVersionRequestType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  languageClient.onRequest(GetDocumentVersionRequestType, (handler) => {
    const doc = workspace.textDocuments.find((doc) => doc.uri.toString() === handler.uri);
    return doc?.version;
  })
}
