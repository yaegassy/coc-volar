import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionList,
  ExtensionContext,
  ForkOptions,
  InitializeParams,
  LanguageClient,
  LanguageClientOptions,
  LinesTextDocument,
  Position,
  ProvideCompletionItemsSignature,
  ServerOptions,
  Thenable,
  TransportKind,
  services,
  workspace,
} from 'coc.nvim';

import * as fs from 'fs';
import * as path from 'path';

import { activate as commonActivate, deactivate as commonDeactivate } from './common';

import {
  config,
  getConfigDisableProgressNotifications,
  getConfigMiddlewareProvideCompletionItemEnable,
  getConfigVolarEnable,
  getDisabledFeatures,
} from './config';

let serverModule: string;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!getConfigVolarEnable()) return;

  return commonActivate(context, (id, name, documentSelector, initOptions, port, outputChannel) => {
    class _LanguageClient extends LanguageClient {
      fillInitializeParams(params: InitializeParams) {
        (params as any).locale = workspace.getConfiguration('volar').get<string>('tsLocale', 'en');
      }
    }

    const vueServerPath = config.server.path ? workspace.expand(config.server.path) : null;
    if (vueServerPath != null && fs.existsSync(vueServerPath)) {
      serverModule = vueServerPath;
    } else {
      serverModule = context.asAbsolutePath(
        path.join('node_modules', '@vue', 'language-server', 'bin', 'vue-language-server.js')
      );
    }

    const runOptions: ForkOptions = {};
    if (config.server.maxOldSpaceSize) {
      runOptions.execArgv ??= [];
      runOptions.execArgv.push('--max-old-space-size=' + config.server.maxOldSpaceSize);
    }

    const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
    const serverOptions: ServerOptions = {
      run: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: runOptions,
      },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions,
      },
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: documentSelector,
      initializationOptions: initOptions,
      progressOnInitialization: !getConfigDisableProgressNotifications(),
      disabledFeatures: getDisabledFeatures(),
      middleware: {
        provideCompletionItem: getConfigMiddlewareProvideCompletionItemEnable()
          ? id === 'vue-semantic-server'
            ? handleProvideCompletionItem
            : undefined
          : undefined,
      },
      outputChannel,
    };

    const client = new _LanguageClient(id, name, serverOptions, clientOptions);

    // **Memo**
    //
    // There is a registerLanguageClient, but it is not available for the
    // slightly older coc.nvim, so an error is possible.
    //
    // Therefore, we will use the old registLanguageClient
    context.subscriptions.push(services.registLanguageClient(client));

    return client;
  });
}

export function deactivate(): Thenable<any> | undefined {
  return commonDeactivate();
}

async function handleProvideCompletionItem(
  document: LinesTextDocument,
  position: Position,
  context: CompletionContext,
  token: CancellationToken,
  next: ProvideCompletionItemsSignature
) {
  const res = await Promise.resolve(next(document, position, context, token));
  const doc = workspace.getDocument(document.uri);
  if (!doc || !res) return [];

  let items: CompletionItem[] = res.hasOwnProperty('isIncomplete')
    ? (res as CompletionList).items
    : (res as CompletionItem[]);

  const pre = doc.getline(position.line).slice(0, position.character);

  if (context.triggerCharacter === '@' || /@\w*$/.test(pre)) {
    items = items.filter((o) => o.label.startsWith('@'));
  }

  return items;
}
