import * as coc from 'coc.nvim';
import { workspace, snippetManager } from 'coc.nvim';
import {
  TextDocument,
  TextDocumentPositionParams,
  Position,
  TextDocumentContentChangeEvent,
  Range,
} from 'vscode-languageserver-protocol';
import { GetTagCloseEditsRequestType } from '../requestTypes';

export async function activate(context: coc.ExtensionContext, htmlClient: coc.LanguageClient) {
  await htmlClient.onReady();

  context.subscriptions.push(
    activateTagClosing(
      (document: coc.TextDocument, position: coc.Position) => {
        const param: TextDocumentPositionParams = {
          textDocument: { uri: document.uri },
          position,
        };
        return htmlClient.sendRequest<string>(GetTagCloseEditsRequestType.method, param);
      },
      { vue: true },
      /** coc-volar */
      'volar.autoClosingTags'
    )
  );
}

export function activateTagClosing(
  tagProvider: (document: TextDocument, position: Position) => Thenable<string>,
  supportedLanguages: { [id: string]: boolean },
  configName: string
): coc.Disposable {
  let disposables: coc.Disposable[] = [];

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

  let isEnabled = false;
  updateEnabledState();

  disposables.push(
    workspace.registerAutocmd({
      event: ['BufEnter'],
      request: false,
      callback: updateEnabledState,
    })
  );

  let timeout: NodeJS.Timer | undefined = undefined;

  async function updateEnabledState(): Promise<void> {
    isEnabled = false;
    const doc = await workspace.document;
    if (!doc) {
      return;
    }
    const document = doc.textDocument;
    if (!supportedLanguages[document.languageId]) {
      return;
    }

    if (!workspace.getConfiguration(undefined, document.uri).get<boolean>(configName)) {
      return;
    }
    isEnabled = true;
  }

  async function onDidChangeTextDocument(
    document: TextDocument,
    changes: readonly TextDocumentContentChangeEvent[]
  ): Promise<void> {
    if (!isEnabled) {
      return;
    }
    const doc = await workspace.document;
    if (!doc) {
      return;
    }
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
    if (lastCharacter !== '>' && lastCharacter !== '/') {
      return;
    }
    if (lastCharacter === undefined) {
      // delete text
      return;
    }
    if (lastChange.text.indexOf('\n') >= 0) {
      // multi-line change
      return;
    }

    const rangeStart =
      'range' in lastChange ? lastChange.range.start : coc.Position.create(0, document.getText().length);
    const version = document.version;

    timeout = setTimeout(async () => {
      const position = Position.create(rangeStart.line, rangeStart.character + lastChange.text.length);
      await tagProvider(document, position).then(async (text) => {
        if (text && isEnabled) {
          const doc = await workspace.document;
          if (!doc) {
            return;
          }
          const activeDocument = doc.textDocument;
          if (document.uri === activeDocument.uri && activeDocument.version === version) {
            // **MEMO**: Do not process text that does not contain "$0"
            //
            // I don't know why, but I've fixed it because the process runs
            // twice and breaks the closing tag.
            //
            // e.g.
            //
            // 1. <div>
            // 2. $0</div>
            // 3. template> <--- ????
            //
            // result. <div>template></div> <---- ????
            //
            if (text.startsWith('$')) {
              snippetManager.insertSnippet(text, false, Range.create(position, position)).catch(() => {
                // noop
              });
            }
          }
        }
      });
      timeout = undefined;
    }, 100);
  }

  return coc.Disposable.create(() => {
    disposables.forEach((disposable) => {
      disposable.dispose();
    });
    disposables = [];
  });
}
