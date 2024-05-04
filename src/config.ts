import { workspace } from 'coc.nvim';

const _config = () => workspace.getConfiguration('vue');

export const config = {
  //update: (section: string, value: any) => _config().update(section, value),
  //get splitEditors(): Readonly<{
  //  icon: boolean;
  //  layout: { left: string[]; right: string[] };
  //}> {
  //  return _config().get('splitEditors')!;
  //},
  //get doctor(): Readonly<{
  //  status: boolean;
  //}> {
  //  return _config().get('doctor')!;
  //},
  get server(): Readonly<{
    path: null | string;
    maxOldSpaceSize: number;
    maxFileSize: number;
  }> {
    return _config().get('server')!;
  },
  get codeActions(): Readonly<{
    enabled: boolean;
    savingTimeLimit: number;
  }> {
    return _config().get('codeActions')!;
  },
  get codeLens(): Readonly<{
    enabled: boolean;
  }> {
    return _config().get('codeLens')!;
  },
  get complete(): Readonly<{
    casing: {
      status: boolean;
      props: 'autoKebab' | 'autoCamel' | 'kebab' | 'camel';
      tags: 'autoKebab' | 'autoPascal' | 'kebab' | 'pascal';
    };
  }> {
    return _config().get('complete')!;
  },
};

//
// Custom configuration for coc-volar.
//

export function getConfigVolarEnable() {
  return workspace.getConfiguration('volar').get<boolean>('enable', true);
}

export function getConfigDisableProgressNotifications() {
  return workspace.getConfiguration('volar').get<boolean>('disableProgressNotifications', false);
}

export function getConfigMiddlewareProvideCompletionItemEnable() {
  return workspace.getConfiguration('volar').get<boolean>('middleware.provideCompletionItem.enable', true);
}

export function getDisabledFeatures() {
  const disabledFeatures: string[] = [];

  if (workspace.getConfiguration('volar').get<boolean>('disableCompletion')) {
    disabledFeatures.push('completion');
  }
  if (workspace.getConfiguration('volar').get<boolean>('disableDiagnostics')) {
    disabledFeatures.push('diagnostics');
  }
  if (workspace.getConfiguration('volar').get<boolean>('disableFormatting')) {
    disabledFeatures.push('formatting');
    disabledFeatures.push('documentFormatting');
    disabledFeatures.push('documentRangeFormatting');
  }
  if (!config.codeActions.enabled) {
    disabledFeatures.push('codeAction');
  }
  if (!config.codeLens.enabled) {
    disabledFeatures.push('codeLens');
  }
  if (getConfigDisableProgressNotifications()) {
    disabledFeatures.push('progress');
  }

  return disabledFeatures;
}
