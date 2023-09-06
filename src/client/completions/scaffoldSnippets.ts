import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionList,
  ExtensionContext,
  InsertTextFormat,
  languages,
  Position,
  TextDocument,
  workspace,
} from 'coc.nvim';

import fs from 'fs';
import path from 'path';

export async function register(context: ExtensionContext) {
  if (workspace.getConfiguration('volar').get<boolean>('scaffoldSnippets.enable')) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        'volar',
        'volar',
        ['vue'],
        new scaffoldSnippetsCompletionProvider(context),
      ),
    );
  }
}

type SnippetsJsonType = {
  [key: string]: {
    description: string;
    prefix: string;
    body: string | string[];
  };
};

class scaffoldSnippetsCompletionProvider implements CompletionItemProvider {
  private _context: ExtensionContext;
  private snippetsFilePaths: string[];

  constructor(context: ExtensionContext) {
    this._context = context;
    this.snippetsFilePaths = [path.join(this._context.extensionPath, 'snippets', 'vue.code-snippets')];
  }

  async getSnippetsCompletionItems(snippetsFilePath: string) {
    const snippetsCompletionList: CompletionItem[] = [];
    if (fs.existsSync(snippetsFilePath)) {
      const snippetsJsonText = fs.readFileSync(snippetsFilePath, 'utf8');
      const snippetsJson: SnippetsJsonType = JSON.parse(snippetsJsonText);
      if (snippetsJson) {
        Object.keys(snippetsJson).map((key) => {
          let snippetsText: string;
          const body = snippetsJson[key].body;
          if (body instanceof Array) {
            snippetsText = body.join('\n');
          } else {
            snippetsText = body;
          }

          // In this extention, "insertText" is handled by "resolveCompletionItem".
          // In "provideCompletionItems", if "insertText" contains only snippets data,
          // it will be empty when the candidate is selected.
          snippetsCompletionList.push({
            label: snippetsJson[key].prefix,
            kind: CompletionItemKind.Snippet,
            filterText: snippetsJson[key].prefix,
            detail: snippetsJson[key].description,
            documentation: { kind: 'markdown', value: '```vue\n' + snippetsText + '\n```' },
            insertTextFormat: InsertTextFormat.Snippet,
            // The "snippetsText" that will eventually be added to the insertText
            // will be stored in the "data" key
            data: snippetsText,
          });
        });
      }
    }

    return snippetsCompletionList;
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CompletionContext,
  ): Promise<CompletionItem[] | CompletionList> {
    if (position.line !== 0) return [];
    const doc = workspace.getDocument(document.uri);
    if (!doc) return [];
    const completionItemList: CompletionItem[] = [];
    this.snippetsFilePaths.forEach((v) => {
      this.getSnippetsCompletionItems(v).then((vv) => completionItemList.push(...vv));
    });

    return completionItemList;
  }

  async resolveCompletionItem(item: CompletionItem): Promise<CompletionItem> {
    if (item.kind === CompletionItemKind.Snippet) {
      item.insertText = item.data;
    }

    return item;
  }
}
