import { commands, ExtensionContext, Uri, Position, Range, Location, LanguageClient } from 'coc.nvim';
import { ShowReferencesNotificationType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  languageClient.onNotification(ShowReferencesNotificationType, (params) => {
    const uri = params.textDocument.uri;
    const pos = params.position;
    const refs = params.references;
    commands.executeCommand(
      'editor.action.showReferences',
      Uri.parse(uri),
      Position.create(pos.line, pos.character),
      refs.map((ref) =>
        Location.create(
          ref.uri,
          Range.create(ref.range.start.line, ref.range.start.character, ref.range.end.line, ref.range.end.character)
        )
      )
    );
  });
}
