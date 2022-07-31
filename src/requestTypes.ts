import * as coc from 'coc.nvim';
import * as shared from '@volar/shared';

/**
 * Client Requests
 */

export const ShowReferencesNotificationType = new coc.NotificationType<shared.ShowReferencesNotification.ResponseType>(
  shared.ShowReferencesNotification.type.method
);

export const FindFileReferenceRequestType = new coc.RequestType<
  shared.FindFileReferenceRequest.ParamsType,
  shared.FindFileReferenceRequest.ResponseType,
  shared.FindFileReferenceRequest.ErrorType
>(shared.FindFileReferenceRequest.type.method);

/**
 * Server Requests
 */

export const AutoInsertRequestType = new coc.RequestType<
  shared.AutoInsertRequest.ParamsType,
  shared.AutoInsertRequest.ResponseType,
  shared.AutoInsertRequest.ErrorType
>(shared.AutoInsertRequest.type.method);

export const VerifyAllScriptsNotificationType = new coc.NotificationType0(
  shared.VerifyAllScriptsNotification.type.method
);

export const ReloadProjectNotificationType = new coc.NotificationType(shared.ReloadProjectNotification.type.method);
