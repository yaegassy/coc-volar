import { ExtensionContext, Uri, workspace } from 'coc.nvim';
import * as shared from '@volar/shared';
import type { LanguageClient } from 'vscode-languageclient/node';

export async function activate(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();
  const schemaDocuments: { [uri: string]: boolean } = {};

  context.subscriptions.push(
    languageClient.onRequest(shared.VSCodeContentRequest.type, (uriPath: string) => {
      const uri = Uri.parse(uriPath);
      if (uri.scheme === 'untitled') {
        return Promise.reject('untitled.schema ' + 'Unable to load {0} ' + uri.toString());
      }
      if (uri.scheme !== 'http' && uri.scheme !== 'https') {
        return workspace.loadFile(uri.fsPath).then(
          (doc) => {
            schemaDocuments[uri.toString()] = true;
            return doc.textDocument.getText();
          },
          (error) => {
            return Promise.reject(error.toString());
          }
        );
      }
      // else if (schemaDownloadEnabled) {
      //     if (runtime.telemetry && uri.authority === 'schema.management.azure.com') {
      //         /* __GDPR__
      //             "json.schema" : {
      //                 "schemaURL" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
      //             }
      //          */
      //         runtime.telemetry.sendTelemetryEvent('json.schema', { schemaURL: uriPath });
      //     }
      //     return runtime.http.getContent(uriPath);
      // }
      else {
        return Promise.reject('Downloading schemas is not support yet');
      }
    })
  );
}
