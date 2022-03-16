import {
  Disposable,
  events,
  ExtensionContext,
  LanguageClient,
  Position,
  Range,
  snippetManager,
  SnippetString,
  TextDocument,
  TextEdit,
  workspace,
} from 'coc.nvim';
import { TextDocumentContentChangeEvent } from 'vscode-languageserver-protocol';
import { AutoInsertRequestType } from '../requestTypes';

export async function activate(context: ExtensionContext, htmlClient: LanguageClient, tsClient: LanguageClient) {
  await Promise.all([htmlClient.onReady(), tsClient.onReady()]);

  const supportedLanguages: Record<string, boolean> = {
    vue: true,
    javascript: true,
    typescript: true,
    javascriptreact: true,
    typescriptreact: true,
  };

  let disposables: Disposable[] = [];
  let isEnabled = false;

  let bufnr: number;

  workspace.document.then((doc) => {
    bufnr = doc.bufnr;
    updateEnabledState(doc.bufnr);
  });

  events.on(
    'BufEnter',
    async (bn) => {
      bufnr = bn;
      if (timeout) clearTimeout(timeout);
      let doc = workspace.getDocument(bufnr);
      if (!doc) {
        doc = await workspace.document;
      }
      updateEnabledState(doc ? doc.bufnr : -1);
    },
    null,
    disposables
  );

  let timeout: NodeJS.Timeout | undefined;

  function updateEnabledState(bufnr: number) {
    isEnabled = false;

    const document = workspace.getDocument(bufnr);
    if (!document || !document.attached) return;
    if (!supportedLanguages[document.textDocument.languageId]) {
      return;
    }

    isEnabled = true;
  }

  workspace.onDidChangeTextDocument(
    (event) => {
      const editor = workspace.getDocument(event.textDocument.uri);
      if (editor) {
        onDidChangeTextDocument(editor.textDocument, event.contentChanges);
      }
    },
    null,
    disposables
  );

  async function onDidChangeTextDocument(
    document: TextDocument,
    changes: readonly TextDocumentContentChangeEvent[]
  ): Promise<void> {
    if (!isEnabled) {
      return;
    }
    const doc = await workspace.document;
    if (!doc) return;
    const activeDocument = doc.textDocument;
    if (document.uri !== activeDocument.uri || changes.length === 0) {
      return;
    }
    if (typeof timeout !== 'undefined') {
      clearTimeout(timeout);
    }
    const lastChange = changes[changes.length - 1];
    if (!Range.is(lastChange['range']) || !lastChange.text) {
      return;
    }
    const lastCharacter = lastChange.text[lastChange.text.length - 1];

    // In case of `/`, `autoCloging` works twice and break the text...
    // Therefore `autoClogging` with `/` is not supported by coc-volar
    if (lastCharacter === '/') return;

    if (!workspace.getConfiguration('volar').get<boolean>('autoClosingTags')) {
      if (lastCharacter === '>') return;
    }

    if (!workspace.getConfiguration('volar').get<boolean>('autoCreateQuotes')) {
      if (lastCharacter === '=') return;
    }

    if (lastCharacter === undefined) {
      // delete text
      return;
    }

    if (lastChange.text.indexOf('\n') >= 0) {
      // multi-line change
      return;
    }

    doAutoInsert(document, lastChange, async (document, position, lastChange) => {
      lastChange['rangeOffset'] = document.offsetAt(position);

      const params = {
        textDocument: { uri: document.uri },
        position,
        options: {
          lastChange: {
            ...lastChange,
            range: lastChange['range'],
          },
        },
      };

      const result =
        (await htmlClient.sendRequest(AutoInsertRequestType.method, params)) ??
        (await tsClient.sendRequest(AutoInsertRequestType.method, params));

      if (typeof result === 'string') {
        return result;
      } else {
        return undefined;
      }
    });
  }

  function doAutoInsert(
    document: TextDocument,
    lastChange: TextDocumentContentChangeEvent,
    provider: (
      document: TextDocument,
      position: Position,
      lastChange: TextDocumentContentChangeEvent
    ) => Thenable<string | TextEdit | null | undefined>
  ) {
    if (!('range' in lastChange)) return;
    const rangeStart = lastChange.range.start;
    const version = document.version;

    timeout = setTimeout(() => {
      const position = Position.create(rangeStart.line, rangeStart.character + lastChange.text.length);
      provider(document, position, lastChange).then((text) => {
        if (text && isEnabled) {
          const doc = workspace.getDocument(document.uri);
          if (!doc) return;
          const activeDocument = doc.textDocument;
          if (document.uri === activeDocument.uri && activeDocument.version === version) {
            if (typeof text === 'string') {
              if (lastChange.text === '>') {
                // autoClosingTags
                snippetManager.insertSnippet(text, true, Range.create(position, position));
              } else if (lastChange.text === '=') {
                // autoCreateQuotes
                snippetManager.insertSnippet(text, true, Range.create(position, position));
              } else {
                // autoCompleteRefs
                snippetManager.insertSnippet(text, true, Range.create(position, position));
              }
            } else {
              snippetManager.insertSnippet(new SnippetString(text.newText), true, text.range);
            }
          }
        }
      });
      timeout = undefined;
    }, 100);
  }

  return Disposable.create(() => {
    disposables.forEach((disposable) => {
      disposable.dispose();
    });
    disposables = [];
  });
}
