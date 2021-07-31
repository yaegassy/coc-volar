import { ExtensionContext, Range, workspace } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  context.subscriptions.push(
    languageClient.onRequest(shared.GetDocumentSelectionRequest.type, async () => {
      const { position } = await workspace.getCurrentState();
      const document = await workspace.document;
      let range: Range | null = null;
      const mode = (await workspace.nvim.call('visualmode')) as string;
      if (mode) {
        range = await workspace.getSelectedRange(mode, document);
      }
      if (!range) range = Range.create(position, position);

      return {
        uri: languageClient.code2ProtocolConverter.asUri(document.uri),
        offset: document.textDocument.offsetAt(range.end),
      };
    })
  );
}
