import {
  commands,
  DocumentSelector,
  Emitter,
  Event,
  ExtensionContext,
  InlayHint,
  InlayHintsProvider,
  LanguageClient,
  languages,
  Range,
  TextDocument,
  workspace,
} from 'coc.nvim';

export async function register(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  const documentSelector: DocumentSelector = [
    { scheme: 'file', language: 'vue' },
    { scheme: 'file', language: 'javascript' },
    { scheme: 'file', language: 'typescript' },
    { scheme: 'file', language: 'javascriptreact' },
    { scheme: 'file', language: 'typescriptreact' },
  ];
  const inlayHintsProvider = new VolarInlayHintsProvider(context, languageClient);

  context.subscriptions.push(languages.registerInlayHintsProvider(documentSelector, inlayHintsProvider));
  context.subscriptions.push(
    commands.registerCommand('volar.toggleInlayHints', async () => {
      await inlayHintsProvider.toggle();
    })
  );
}

export class VolarInlayHintsProvider implements InlayHintsProvider {
  private readonly _onDidChangeInlayHints = new Emitter<void>();
  public readonly onDidChangeInlayHints: Event<void> = this._onDidChangeInlayHints.event;

  private inlayHintsEnabled: boolean;
  private context: ExtensionContext;
  private client: LanguageClient;

  constructor(context: ExtensionContext, client: LanguageClient) {
    this.context = context;
    this.client = client;
    this.inlayHintsEnabled = !!workspace.getConfiguration('volar').get<boolean>('inlayHints.enable');
  }

  async provideInlayHints(document: TextDocument, range: Range) {
    const inlayHints: InlayHint[] = [];
    if (!this.inlayHintsEnabled) return [];

    const response: InlayHint[] = await this.client.sendRequest('textDocument/inlayHint', {
      textDocument: { uri: document.uri },
      range,
    });
    if (!response) return [];

    response.forEach((r) => {
      const hint: InlayHint = {
        label: r.label,
        position: r.position,
        kind: r.kind ?? r.kind,
        paddingLeft: r.paddingLeft ? r.paddingLeft : undefined,
        paddingRight: r.paddingRight ? r.paddingRight : undefined,
        textEdits: r.textEdits ? r.textEdits : undefined,
        tooltip: r.tooltip ? r.tooltip : undefined,
        data: r.data ? r.data : undefined,
      };

      inlayHints.push(hint);
    });

    return inlayHints;
  }

  async toggle() {
    if (this.inlayHintsEnabled) {
      this.inlayHintsEnabled = false;
      this._onDidChangeInlayHints.fire();
    } else {
      this.inlayHintsEnabled = true;
      this._onDidChangeInlayHints.fire();
    }
  }
}
