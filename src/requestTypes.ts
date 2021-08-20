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

export const GetTagCloseEditsRequestType = new coc.RequestType<
  shared.GetTagCloseEditsRequest.ParamsType,
  shared.GetTagCloseEditsRequest.ResponseType,
  shared.GetTagCloseEditsRequest.ErrorType
>(shared.GetTagCloseEditsRequest.type.method);

export const GetRefCompleteEditsRequestType = new coc.RequestType<
  shared.GetRefCompleteEditsRequest.ParamsType,
  shared.GetRefCompleteEditsRequest.ResponseType,
  shared.GetRefCompleteEditsRequest.ErrorType
>(shared.GetRefCompleteEditsRequest.type.method);

export const VerifyAllScriptsNotificationType = new coc.NotificationType0(
  shared.VerifyAllScriptsNotification.type.method
);
