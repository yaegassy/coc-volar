import { commands, ExtensionContext, Uri, Position, Range, Location } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  context.subscriptions.push(
    languageClient.onNotification(shared.ShowReferencesNotification.type, (handler) => {
      const uri = handler.uri;
      const pos = handler.position;
      const refs = handler.references;
      commands.executeCommand(
        'editor.action.showReferences',
        Uri.parse(uri),
        Position.create(pos.line, pos.character),
        refs.map((ref) =>
          Location.create(
            // @ts-ignore
            Uri.parse(ref.uri),
            Range.create(ref.range.start.line, ref.range.start.character, ref.range.end.line, ref.range.end.character)
          )
        )
      );
    })
  );
}
