import {
  AutoInsertRequest,
  FindFileReferenceRequest,
  ReloadProjectNotification,
  ShowReferencesNotification,
  VerifyAllScriptsNotification,
  GetVirtualFileNamesRequest,
  GetVirtualFileRequest,
} from '@volar/vue-language-server';
import * as coc from 'coc.nvim';

/**
 * Server Requests
 */

export const ShowReferencesNotificationType = new coc.NotificationType<ShowReferencesNotification.ResponseType>(
  ShowReferencesNotification.type.method
);

/**
 * Client Requests
 */

export const FindFileReferenceRequestType = new coc.RequestType<
  FindFileReferenceRequest.ParamsType,
  FindFileReferenceRequest.ResponseType,
  FindFileReferenceRequest.ErrorType
>(FindFileReferenceRequest.type.method);

export const AutoInsertRequestType = new coc.RequestType<
  AutoInsertRequest.ParamsType,
  AutoInsertRequest.ResponseType,
  AutoInsertRequest.ErrorType
>(AutoInsertRequest.type.method);

export const VerifyAllScriptsNotificationType = new coc.NotificationType0(VerifyAllScriptsNotification.type.method);

export const ReloadProjectNotificationType = new coc.NotificationType(ReloadProjectNotification.type.method);

export const GetVirtualFileNamesRequestType = new coc.RequestType<
  GetVirtualFileNamesRequest.ParamsType,
  GetVirtualFileNamesRequest.ResponseType,
  GetVirtualFileNamesRequest.ErrorType
>(GetVirtualFileNamesRequest.type.method);

export const GetVirtualFileRequestType = new coc.RequestType<
  GetVirtualFileRequest.ParamsType,
  GetVirtualFileRequest.ResponseType,
  GetVirtualFileRequest.ErrorType
>(GetVirtualFileRequest.type.method);
