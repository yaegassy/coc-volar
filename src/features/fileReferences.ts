import {
  commands,
  LanguageClient,
  ExtensionContext,
  Uri,
  window,
  workspace,
  Position,
  Location,
  Range,
} from 'coc.nvim';
import { FindFileReferenceRequestType } from '../requestTypes';

export async function register(context: ExtensionContext, client: LanguageClient) {
  commands.registerCommand('vue.findAllFileReferences', async (uri: Uri) => {
    await window.withProgress(
      {
        title: 'Finding file references',
        cancellable: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (_progress, token) => {
        // MEMO: patch for coc-volar
        const { document } = await workspace.getCurrentState();

        const response = await client.sendRequest(FindFileReferenceRequestType, {
          // MEMO: patch for coc-volar
          //textDocument: { uri: uri.toString() },
          textDocument: { uri: document.uri },
        });
        if (!response) {
          return;
        }

        await commands.executeCommand(
          'editor.action.showReferences',
          uri,
          Position.create(0, 0),
          response.map((ref) =>
            Location.create(
              ref.uri,
              Range.create(
                Position.create(ref.range.start.line, ref.range.end.line),
                Position.create(ref.range.end.line, ref.range.end.character)
              )
            )
          )
        );
      }
    );
  });
}
