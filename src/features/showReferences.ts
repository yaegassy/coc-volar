import { commands, ExtensionContext, Uri, Position, Range, Location, LanguageClient } from 'coc.nvim';
import { ShowReferencesNotificationType } from '../requestTypes';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  languageClient.onNotification(ShowReferencesNotificationType, (handler) => {
    const uri = handler.uri;
    const pos = handler.position;
    const refs = handler.references;
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
