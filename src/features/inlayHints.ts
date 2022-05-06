import { commands, Disposable, Document, events, ExtensionContext, LanguageClient, Range, workspace } from 'coc.nvim';
import { InlayHint } from 'vscode-languageserver-types';

const supportLanguages = ['vue', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  await workspace.nvim.command('hi default link CocVolarTypeHint CocHintSign');
  const inlayHintsProvider = new VolarInlayHintsProvider(context, languageClient);
  inlayHintsProvider.activate();
  context.subscriptions.push(inlayHintsProvider);

  context.subscriptions.push(
    commands.registerCommand('volar.toggleInlayHints', async () => {
      await inlayHintsProvider.toggle();
    })
  );
}

export class VolarInlayHintsProvider implements Disposable {
  private readonly disposables: Disposable[] = [];
  private inlayHintsNS = workspace.createNameSpace('volar-inlay-hint');
  private inlayHintsEnabled: boolean;
  private _inlayHints: Map<string, InlayHint[]> = new Map();
  private _context: ExtensionContext;
  private _client: LanguageClient;

  constructor(context: ExtensionContext, client: LanguageClient) {
    this._context = context;
    this._client = client;
    this.inlayHintsEnabled = !!workspace.getConfiguration('volar').get<boolean>('inlayHints.enable');
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this._inlayHints.clear();
  }

  async activate() {
    events.on('InsertLeave', async (bufnr) => {
      const doc = workspace.getDocument(bufnr);
      if (doc && supportLanguages.includes(doc.languageId)) {
        this.syncAndRenderHints(doc);
      }
    });

    workspace.onDidChangeTextDocument(
      (e) => {
        const doc = workspace.getDocument(e.bufnr);
        if (doc && supportLanguages.includes(doc.languageId)) {
          if (events.insertMode) {
            return;
          }
          this.syncAndRenderHints(doc);
        }
      },
      this,
      this.disposables
    );

    workspace.onDidOpenTextDocument(
      (e) => {
        if (e && supportLanguages.includes(e.languageId)) {
          const doc = workspace.getDocument(e.uri);
          this.syncAndRenderHints(doc);
        }
      },
      this,
      this.disposables
    );

    const current = await workspace.document;
    if (supportLanguages.includes(current.languageId)) {
      this.syncAndRenderHints(current);
    }
  }

  async toggle() {
    if (this.inlayHintsEnabled) {
      this.inlayHintsEnabled = false;

      const doc = await workspace.document;
      if (!doc) return;

      doc.buffer.clearNamespace(this.inlayHintsNS);
    } else {
      this.inlayHintsEnabled = true;
      await this.activate();
    }
  }

  private async syncAndRenderHints(doc: Document) {
    if (!this.inlayHintsEnabled) return;
    if (doc && supportLanguages.includes(doc.languageId)) {
      this.fetchHints(doc).then(async (hints) => {
        if (!hints) return;
        this.renderHints(doc, hints);
      });
    }
  }

  private async fetchHints(doc: Document): Promise<null | InlayHint[]> {
    const endLine = doc.lineCount - 1;
    const endChar = doc.getline(endLine).length;
    const range = Range.create(0, 0, doc.lineCount - 1, endChar);
    const param = { range, textDocument: { uri: doc.uri.toString() } };
    return this._client.sendRequest<InlayHint[] | null>('textDocument/inlayHint', param);
  }

  private async renderHints(doc: Document, hints: InlayHint[]) {
    this._inlayHints.set(doc.uri, hints);

    const chaining_hints = {};
    for (const item of hints) {
      const chunks: [[string, string]] = [[item.label.toString(), 'CocVolarTypeHint']];
      if (chaining_hints[item.position.line] === undefined) {
        chaining_hints[item.position.line] = chunks;
      } else {
        chaining_hints[item.position.line].push([' ', 'Normal']);
        chaining_hints[item.position.line].push(chunks[0]);
      }
    }

    doc.buffer.clearNamespace(this.inlayHintsNS);
    Object.keys(chaining_hints).forEach(async (line) => {
      await doc.buffer.setVirtualText(this.inlayHintsNS, Number(line), chaining_hints[line], {});
    });
  }
}
