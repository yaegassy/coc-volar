import * as coc from 'coc.nvim';
import * as shared from '@volar/shared';

/**
 * Client Requests
 */

export const ShowReferencesNotificationType = new coc.NotificationType<shared.ShowReferencesNotification.ParamsType>(
  shared.ShowReferencesNotification.type.method
);

export const GetDocumentVersionRequestType = new coc.RequestType<
  shared.GetDocumentVersionRequest.ParamsType,
  shared.GetDocumentVersionRequest.ResponseType,
  shared.GetDocumentVersionRequest.ErrorType
>(shared.GetDocumentVersionRequest.type.method);

export const GetDocumentPrintWidthRequestType = new coc.RequestType<
  shared.GetDocumentPrintWidthRequest.ParamsType,
  shared.GetDocumentPrintWidthRequest.ResponseType,
  shared.GetDocumentPrintWidthRequest.ErrorType
>(shared.GetDocumentPrintWidthRequest.type.method);

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
