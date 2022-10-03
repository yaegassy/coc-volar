import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  Command,
  CreateFile,
  DeleteFile,
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  LinesTextDocument,
  ProvideCodeActionsSignature,
  Range,
  RenameFile,
  ServerOptions,
  TextDocumentEdit,
  Thenable,
  TransportKind,
  workspace,
} from 'coc.nvim';

import * as fs from 'fs';
import * as path from 'path';

import { activate as commonActivate, deactivate as commonDeactivate, processHtml, processMd } from './common';

let serverModule: string;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!getConfigVolarEnable()) return;

  return commonActivate(context, (id, name, langs, initOptions, fillInitializeParams, port) => {
    const devVolarServerPath = workspace.expand(getConfigDevServerPath());
    if (devVolarServerPath && fs.existsSync(devVolarServerPath)) {
      serverModule = devVolarServerPath;
    } else {
      serverModule = context.asAbsolutePath(
        path.join('node_modules', '@volar', 'vue-language-server', 'bin', 'vue-language-server.js')
      );
    }

    const maxOldSpaceSize = workspace.getConfiguration('volar').get<number | null>('vueserver.maxOldSpaceSize');
    const runOptions = { execArgv: <string[]>[] };
    if (maxOldSpaceSize) {
      runOptions.execArgv.push('--max-old-space-size=' + maxOldSpaceSize);
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

    const globPatterns: string[] = ['**/*.vue', '**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.json'];
    if (processMd()) {
      globPatterns.push('**/*.md');
    }
    if (processHtml()) {
      globPatterns.push('**/*.html');
    }
    const watcherGlobPattern = '{' + globPatterns.join(',') + '}';

    const clientOptions: LanguageClientOptions = {
      documentSelector: langs.map((lang) => {
        return {
          scheme: 'file',
          languages: lang,
        };
      }),
      initializationOptions: initOptions,
      progressOnInitialization: getConfigProgressOnInitialization(),
      middleware: {
        provideCodeActions: getConfigMiddlewareProvideCodeActionsEnable()
          ? id === 'vue-semantic-server'
            ? handleProvideCodeActions
            : undefined
          : undefined,
      },
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher(watcherGlobPattern),
      },
    };

    const client = new LanguageClient(id, name, serverOptions, clientOptions);
    context.subscriptions.push(client.start());

    return client;
  });
}

export function deactivate(): Thenable<any> | undefined {
  return commonDeactivate();
}

async function handleProvideCodeActions(
  document: LinesTextDocument,
  range: Range,
  context: CodeActionContext,
  token: CancellationToken,
  next: ProvideCodeActionsSignature
) {
  const originalActions = await next(document, range, context, token);
  if (!originalActions) return [];

  const newActions: (CodeAction | Command)[] = [];
  for (const originalAction of originalActions) {
    if ('disabled' in originalAction) {
      // volar's langauge sever also lists code-actions that are not executable in the current context.
      // code-action with the "disabled" property are excludes from the new code-action list.
      continue;
    } else if ('edit' in originalAction) {
      if (originalAction.edit && originalAction.edit.documentChanges) {
        const newDocumentChanges: (TextDocumentEdit | CreateFile | RenameFile | DeleteFile)[] = [];

        for (const documentChange of originalAction.edit.documentChanges) {
          if ('textDocument' in documentChange) {
            const newTextDocumentEdit: TextDocumentEdit = {
              textDocument: {
                uri: documentChange.textDocument.uri,
                version: 0,
              },
              edits: documentChange.edits,
            };
            newDocumentChanges.push(newTextDocumentEdit);
          } else {
            newDocumentChanges.push(documentChange);
          }
        }

        const newAction: CodeAction = {
          title: originalAction.title,
          kind: originalAction.kind ?? originalAction.kind,
          diagnostics: originalAction.diagnostics ?? originalAction.diagnostics,
          isPreferred: originalAction.isPreferred ?? originalAction.isPreferred,
          edit: {
            changes: originalAction.edit.changes ?? originalAction.edit.changes,
            documentChanges: newDocumentChanges,
          },
          command: originalAction.command ?? originalAction.command,
          clientId: originalAction.clientId ?? originalAction.clientId,
        };
        newActions.push(newAction);
      } else {
        newActions.push(originalAction);
      }
    } else {
      newActions.push(originalAction);
    }
  }

  return newActions;
}

function getConfigVolarEnable() {
  return workspace.getConfiguration('volar').get<boolean>('enable', true);
}

function getConfigProgressOnInitialization() {
  return workspace.getConfiguration('volar').get<boolean>('progressOnInitialization.enable', true);
}

function getConfigDevServerPath() {
  return workspace.getConfiguration('volar').get<string>('dev.serverPath', '');
}

function getConfigMiddlewareProvideCodeActionsEnable() {
  return workspace.getConfiguration('volar').get<boolean>('middleware.provideCodeActions.enable', true);
}
