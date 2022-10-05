import { commands, ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import { GetVirtualFileNamesRequestType, GetVirtualFileRequestType } from '../requestTypes';

export async function register(context: ExtensionContext, client: LanguageClient) {
  await client.onReady();

  context.subscriptions.push(
    commands.registerCommand('volar.action.showVirtualFiles', async () => {
      const { document } = await workspace.getCurrentState();

      const fileNames = await client.sendRequest<string[]>(GetVirtualFileNamesRequestType.method, {
        uri: document.uri,
      });

      const virtual = await client.sendRequest(GetVirtualFileRequestType, {
        sourceFileUri: document.uri,
        virtualFileName: fileNames[0],
      });

      const bufferName = 'volar-virtual-file';
      const filetype = getFiletypeFrom(fileNames[0]);

      await workspace.nvim
        .command(
          `belowright vnew ${bufferName} | setlocal buftype=nofile bufhidden=hide noswapfile filetype=${filetype}`
        )
        .then(async () => {
          const buf = await workspace.nvim.buffer;
          buf.setLines(virtual.content.split('\n'), { start: 0, end: -1 });
        });
    })
  );
}

function getFiletypeFrom(fileName: string) {
  if (fileName.endsWith('.ts')) {
    return 'typescript';
  } else if (fileName.endsWith('.js')) {
    return 'javascript';
  }
  return 'typescript';
}
