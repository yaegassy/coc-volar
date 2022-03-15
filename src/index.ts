import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionList,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  Position,
  ProvideCompletionItemsSignature,
  ServerOptions,
  Thenable,
  TransportKind,
  workspace,
} from 'coc.nvim';

import * as path from 'path';
import * as fs from 'fs';

import { activate as commonActivate, deactivate as commonDeactivate } from './common';

let serverModule: string;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!getConfigVolarEnable()) return;

  return commonActivate(context, (id, name, documentSelector, initOptions, port) => {
    const devVolarServerPath = workspace.expand(getConfigDevServerPath());
    if (devVolarServerPath && fs.existsSync(devVolarServerPath)) {
      serverModule = devVolarServerPath;
    } else {
      serverModule = context.asAbsolutePath(
        path.join('node_modules', '@volar', 'vue-language-server', 'bin', 'vue-language-server.js')
      );
    }

    const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions,
      },
    };

    const memory = Math.floor(Number(getConfigMaxMemory()));
    if (memory && memory >= 256) {
      const maxOldSpaceSize = '--max-old-space-size=' + memory.toString();
      serverOptions.run.options = { execArgv: [maxOldSpaceSize] };
      if (serverOptions.debug.options) {
        if (serverOptions.debug.options.execArgv) {
          serverOptions.debug.options.execArgv.push(maxOldSpaceSize);
        }
      }
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector,
      initializationOptions: initOptions,
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('{**/*.vue,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.json}'),
      },
      // **See**:
      // issue: https://github.com/yaegassy/coc-volar/issues/38
      // patch: https://github.com/yaegassy/coc-volar/pull/39
      middleware: getConfigFixCompletion()
        ? {
            provideCompletionItem:
              id === 'volar-api'
                ? async (
                    document,
                    position: Position,
                    context: CompletionContext,
                    token: CancellationToken,
                    next: ProvideCompletionItemsSignature
                  ) => {
                    const res = await Promise.resolve(next(document, position, context, token));
                    const doc = workspace.getDocument(document.uri);
                    if (!doc || !res) return [];

                    const items: CompletionItem[] = res.hasOwnProperty('isIncomplete')
                      ? (res as CompletionList).items
                      : (res as CompletionItem[]);

                    // **MEMO**:
                    // If further fine-tuning of the completion items is needed, this is the place to do it.
                    // ----
                    // data.mode: 'ts' | 'html' | 'css'
                    // ----
                    // items.forEach((e) => {
                    //   if (e.data?.mode === 'css') {
                    //     //
                    //   }
                    // });

                    return items;
                  }
                : undefined,
          }
        : undefined,
    };

    const client = new LanguageClient(id, name, serverOptions, clientOptions);
    context.subscriptions.push(client.start());

    return client;
  });
}

export function deactivate(): Thenable<any> | undefined {
  return commonDeactivate();
}

function getConfigVolarEnable() {
  return workspace.getConfiguration('volar').get<boolean>('enable', true);
}

function getConfigDevServerPath() {
  return workspace.getConfiguration('volar').get<string>('dev.serverPath', '');
}

function getConfigMaxMemory() {
  return workspace.getConfiguration('volar').get<number | null>('maxMemory');
}

function getConfigFixCompletion() {
  return workspace.getConfiguration('volar').get<boolean>('fix.completion', true);
}
