import {
  AutoInsertRequest,
  FindFileReferenceRequest,
  GetComponentMeta,
  GetVirtualFileNamesRequest,
  GetVirtualFileRequest,
  ReloadProjectNotification,
  ReportStats,
} from '@volar/vue-language-server';
import * as coc from 'coc.nvim';

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

export const ReportStatsType = new coc.NotificationType(ReportStats.type.method);

export const GetComponentMetaType = new coc.RequestType<
  GetComponentMeta.ParamsType,
  GetComponentMeta.ResponseType,
  GetComponentMeta.ErrorType
>(GetComponentMeta.type.method);
