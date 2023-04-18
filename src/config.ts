import { workspace } from 'coc.nvim';

const volarConfigs = workspace.getConfiguration('volar');
const vueConfigs = workspace.getConfiguration('vue');

export const config = {
  //splitEditors: {
  //  get layout() {
  //    return volarConfigs.get<{ left: string[]; right: string[] }>('splitEditors.layout') ?? { left: [], right: [] };
  //  },
  //},
  features: {
    updateImportsOnFileMove: {
      get enable() {
        return vueConfigs.get<boolean>('features.updateImportsOnFileMove.enable');
      },
    },
    codeActions: {
      get enable() {
        return vueConfigs.get<boolean>('features.codeActions.enable');
      },
    },
    codeLens: {
      get enable() {
        return vueConfigs.get<boolean>('features.codeLens.enable');
      },
    },
    complete: {
      get attrNameCasing() {
        return vueConfigs.get<'autoKebab' | 'autoCamel' | 'kebab' | 'camel'>('features.complete.propNameCasing');
      },
      get tagNameCasing() {
        return vueConfigs.get<'autoKebab' | 'autoPascal' | 'kebab' | 'pascal'>('features.complete.tagNameCasing');
      },
    },
  },
  json: {
    get customBlockSchemaUrls() {
      return volarConfigs.get<Record<string, string>>('json.customBlockSchemaUrls');
    },
  },
  vueserver: {
    get maxOldSpaceSize() {
      return volarConfigs.get<number>('vueserver.maxOldSpaceSize');
    },
    get maxFileSize() {
      return volarConfigs.get<number>('vueserver.maxFileSize');
    },
    get reverseConfigFilePriority() {
      return volarConfigs.get<boolean>('vueserver.reverseConfigFilePriority');
    },
    get diagnosticModel() {
      return volarConfigs.get<'push' | 'pull'>('vueserver.diagnosticModel');
    },
    get additionalExtensions() {
      return volarConfigs.get<string[]>('vueserver.additionalExtensions') ?? [];
    },
    get fullCompletionList() {
      return volarConfigs.get<boolean>('vueserver.fullCompletionList');
    },
    get configFilePath() {
      return volarConfigs.get<string>('vueserver.configFilePath');
    },
    petiteVue: {
      get processHtmlFile() {
        return volarConfigs.get<boolean>('vueserver.petiteVue.processHtmlFile');
      },
    },
    vitePress: {
      get processMdFile() {
        return volarConfigs.get<boolean>('vueserver.vitePress.processMdFile');
      },
    },
  },
  //doctor: {
  //  get status() {
  //    return volarConfigs.get<boolean>('doctor.status');
  //  },
  //},
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

export function getConfigDevServerPath() {
  return workspace.getConfiguration('volar').get<string>('dev.serverPath', '');
}

export function getConfigMiddlewareProvideCodeActionsEnable() {
  return workspace.getConfiguration('volar').get<boolean>('middleware.provideCodeActions.enable', true);
}

export function getConfigMiddlewareProvideCompletionItemEnable() {
  return workspace.getConfiguration('volar').get<boolean>('middleware.provideCompletionItem.enable', true);
}

export function getDisabledFeatures() {
  const disabledFeatures: string[] = [];

  if (workspace.getConfiguration('volar').get<boolean>('disableDiagnostics')) {
    disabledFeatures.push('diagnostics');
  }
  if (workspace.getConfiguration('volar').get<boolean>('disableFormatting')) {
    disabledFeatures.push('formatting');
    disabledFeatures.push('documentFormatting');
    disabledFeatures.push('documentRangeFormatting');
  }
  if (getConfigDisableProgressNotifications()) {
    disabledFeatures.push('progress');
  }

  return disabledFeatures;
}
