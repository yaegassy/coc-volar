import { commands, ExtensionContext, Position, workspace } from 'coc.nvim';
import { ref, computed } from '@vue/reactivity';
import { parse, SFCBlock } from '@vue/compiler-sfc';

interface CocVolarSFCBlock {
  lang: string | undefined;
  start: number;
  end: number;
}

// porting: https://github.com/johnsoncodehk/volar/blob/master/packages/shared/src/common.ts
function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.action.splitEditors', onSplit));

  async function onSplit() {
    const getDocDescriptor = useDocDescriptor();

    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const { descriptor } = getDocDescriptor(doc.textDocument.getText());
    const blocksSet: SFCBlock[][] = [];

    const scriptBlocks: CocVolarSFCBlock[] = [];
    const templateBlocks: CocVolarSFCBlock[] = [];
    const styleBlocks: CocVolarSFCBlock[] = [];
    const customBlocks: CocVolarSFCBlock[] = [];

    if (descriptor.scriptSetup || descriptor.script) {
      blocksSet.push([descriptor.scriptSetup, descriptor.script].filter(notEmpty));
    }
    if (descriptor.template) {
      blocksSet.push([descriptor.template]);
    }
    if (descriptor.styles.length) {
      blocksSet.push(descriptor.styles);
    }
    if (descriptor.customBlocks.length) {
      blocksSet.push(descriptor.customBlocks);
    }

    for (let i = 0; i < blocksSet.length; i++) {
      for (const v of blocksSet[i]) {
        switch (v.type) {
          case 'script':
            scriptBlocks.push({
              lang: v.lang,
              start: v.loc.start.line,
              end: v.loc.end.line,
            });
            break;
          case 'template':
            templateBlocks.push({
              lang: v.lang,
              start: v.loc.start.line,
              end: v.loc.end.line,
            });
            break;
          case 'style':
            styleBlocks.push({
              lang: v.lang,
              start: v.loc.start.line,
              end: v.loc.end.line,
            });
            break;

          default:
            customBlocks.push({
              lang: v.lang,
              start: v.loc.start.line,
              end: v.loc.end.line,
            });
            break;
        }
      }
    }

    let currentSplitCount = 0;

    if (scriptBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(scriptBlocks[0].start, scriptBlocks[0].end));

      if (templateBlocks.length >= 1) await foldingSFCBlock(templateBlocks);
      if (styleBlocks.length >= 1) await foldingSFCBlock(styleBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (templateBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(templateBlocks[0].start, templateBlocks[0].end));

      if (scriptBlocks.length >= 1) await foldingSFCBlock(scriptBlocks);
      if (styleBlocks.length >= 1) await foldingSFCBlock(styleBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (styleBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(styleBlocks[0].start, styleBlocks[0].end));

      if (scriptBlocks.length >= 1) await foldingSFCBlock(scriptBlocks);
      if (templateBlocks.length >= 1) await foldingSFCBlock(templateBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (customBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(customBlocks[0].start, customBlocks[0].end));

      if (scriptBlocks.length >= 1) await foldingSFCBlock(scriptBlocks);
      if (templateBlocks.length >= 1) await foldingSFCBlock(templateBlocks);
      if (styleBlocks.length >= 1) await foldingSFCBlock(styleBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }
  }
}

function useDocDescriptor() {
  const splitDocText = ref('');
  const splitDocDescriptor = computed(() => parse(splitDocText.value, { sourceMap: false, ignoreEmpty: false }));

  return getDescriptor;

  function getDescriptor(text: string) {
    splitDocText.value = text;
    return splitDocDescriptor.value;
  }
}

async function foldingSFCBlock(blockRanges: CocVolarSFCBlock[]) {
  for (const v of blockRanges) {
    await workspace.nvim.command(`${v.start},${v.end}fold`);
  }
}

async function doSplitWindow(maxSplitCount: number, currentSplitCount: number) {
  if (maxSplitCount > currentSplitCount) {
    if (currentSplitCount % 2 === 1) {
      await workspace.nvim.command('belowright vsplit || 1,$foldopen');
    }
    if (currentSplitCount % 2 === 0) {
      await workspace.nvim.command('belowright split || 1,$foldopen');
    }
  }
}
