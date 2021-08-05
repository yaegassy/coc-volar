import { ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import { GetDocumentPrintWidthRequestType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  languageClient.onRequest(GetDocumentPrintWidthRequestType, (handler) => {
    const configs = workspace.getConfiguration('volar');
    return configs.get<number>('formatting.printWidth');
  });
}
