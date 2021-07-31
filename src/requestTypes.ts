import * as coc from 'coc.nvim';
import * as shared from '@volar/shared';

/**
 * Client Requests
 */

export const ShowReferencesNotificationType = new coc.NotificationType<
  NonNullable<typeof shared.ShowReferencesNotification.type._>[0]
>(shared.ShowReferencesNotification.type.method);

export const GetDocumentVersionRequestType = new coc.RequestType<
  NonNullable<typeof shared.GetDocumentVersionRequest.type._>[0],
  NonNullable<typeof shared.GetDocumentVersionRequest.type._>[1],
  NonNullable<typeof shared.GetDocumentVersionRequest.type._>[3]
>(shared.GetDocumentVersionRequest.type.method);

/**
 * Server Requests
 */

export const RestartServerNotificationType = new coc.NotificationType<
  NonNullable<typeof shared.RestartServerNotification.type._>[0]
>(shared.RestartServerNotification.type.method);

export const VerifyAllScriptsRequestType = new coc.RequestType<
  NonNullable<typeof shared.VerifyAllScriptsRequest.type._>[0],
  NonNullable<typeof shared.VerifyAllScriptsRequest.type._>[1],
  NonNullable<typeof shared.VerifyAllScriptsRequest.type._>[3]
>(shared.VerifyAllScriptsRequest.type.method);
