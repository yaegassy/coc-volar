import {
  CodeAction,
  CodeActionContext,
  CodeActionProvider,
  Position,
  Range,
  TextEdit,
  TextDocument,
  workspace,
} from 'coc.nvim';

export class VolarCodeActionProvider implements CodeActionProvider {
  public async provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext) {
    const doc = workspace.getDocument(document.uri);
    const wholeRange = Range.create(0, 0, doc.lineCount, 0);
    let whole = false;
    if (
      range.start.line === wholeRange.start.line &&
      range.start.character === wholeRange.start.character &&
      range.end.line === wholeRange.end.line &&
      range.end.character === wholeRange.end.character
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whole = true;
    }
    const codeActions: CodeAction[] = [];

    /** Add @ts-ignore for this line */
    if (this.lineRange(range) && context.diagnostics.length > 0) {
      let existsVolarTsDiagnostics = false;
      context.diagnostics.forEach((d) => {
        console.log(d.source);
        if (d.source === 'ts') {
          existsVolarTsDiagnostics = true;
        }
      });

      const thisLineFullLength = doc.getline(range.start.line).length;
      const thisLineTrimLength = doc.getline(range.start.line).trim().length;
      const suppressLineLength = thisLineFullLength - thisLineTrimLength;

      let suppressLineNewText = '// @ts-ignore\n';
      if (suppressLineLength > 0) {
        const addIndentSpace = ' '.repeat(suppressLineLength);
        suppressLineNewText = '// @ts-ignore\n' + addIndentSpace;
      }

      let thisLineContent = doc.getline(range.start.line);
      thisLineContent = thisLineContent.trim();

      if (
        !thisLineContent.startsWith('//') &&
        !thisLineContent.startsWith('/*') &&
        !thisLineContent.startsWith('*') &&
        existsVolarTsDiagnostics
      ) {
        const edit = TextEdit.insert(Position.create(range.start.line, suppressLineLength), suppressLineNewText);
        codeActions.push({
          title: 'Add @ts-ignore for this line',
          edit: {
            changes: {
              [doc.uri]: [edit],
            },
          },
        });
      }
    }

    return codeActions;
  }

  private lineRange(r: Range): boolean {
    return (
      (r.start.line + 1 === r.end.line && r.start.character === 0 && r.end.character === 0) ||
      (r.start.line === r.end.line && r.start.character === 0)
    );
  }
}
