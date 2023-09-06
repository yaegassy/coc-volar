import { commands, LanguageClient, Location, Position, Range, Uri, window, workspace } from 'coc.nvim';
import { FindFileReferenceRequestType } from '../requestTypes';

export async function register(cmd: string, client: LanguageClient) {
  commands.registerCommand(cmd, async (uri?: Uri) => {
    await window.withProgress(
      {
        title: 'Finding file references',
        cancellable: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (_progress, token) => {
        if (!uri) {
          const { document } = await workspace.getCurrentState();
          uri = Uri.parse(document.uri);
        }

        const response = await client.sendRequest(FindFileReferenceRequestType, {
          textDocument: { uri: uri.toString() },
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
                Position.create(ref.range.end.line, ref.range.end.character),
              ),
            ),
          ),
        );
      },
    );
  });
}
