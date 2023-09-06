import { commands, ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import path from 'path';

import { GetComponentMetaType } from '../requestTypes';

export async function register(context: ExtensionContext, client: LanguageClient) {
  await client.onReady();

  context.subscriptions.push(
    commands.registerCommand('volar.action.showComponentMeta', async () => {
      const { document } = await workspace.getCurrentState();

      const meta = await client.sendRequest(GetComponentMetaType, {
        uri: document.uri,
      });

      const bufferName = path.basename(document.uri) + '.meta.json';

      await workspace.nvim
        .command(`belowright vnew ${bufferName} | setlocal buftype=nofile bufhidden=hide noswapfile filetype=json`)
        .then(async () => {
          const buf = await workspace.nvim.buffer;
          buf.setLines(JSON.stringify(meta, undefined, '\t').split('\n'), { start: 0, end: -1 });
        });
    }),
  );
}
