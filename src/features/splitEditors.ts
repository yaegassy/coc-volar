import { commands, ExtensionContext, Position, workspace } from 'coc.nvim';

import { parse, SFCBlock } from '@vue/compiler-sfc';
import { ref, computed } from '@vue/reactivity';
import * as shared from '@volar/shared';

interface SimpleSFCBlock {
  type: string;
  start: number;
  end: number;
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.action.splitEditors', onSplit));

  async function onSplit() {
    const getDocDescriptor = useDocDescriptor();

    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const descriptor = getDocDescriptor(doc.textDocument.getText());
    const blocksSet: SFCBlock[][] = [];

    const scriptBlocks: SimpleSFCBlock[] = [];
    const templateBlocks: SimpleSFCBlock[] = [];
    const styleBlocks: SimpleSFCBlock[] = [];
    const customBlocks: SimpleSFCBlock[] = [];

    if (descriptor.scriptSetup || descriptor.script) {
      blocksSet.push([descriptor.scriptSetup, descriptor.script].filter(shared.notEmpty));
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
            scriptBlocks.push({ type: v.type, start: v.loc.start.line, end: v.loc.end.line });
            break;
          case 'template':
            templateBlocks.push({ type: v.type, start: v.loc.start.line, end: v.loc.end.line });
            break;
          case 'style':
            styleBlocks.push({ type: v.type, start: v.loc.start.line, end: v.loc.end.line });
            break;
          default:
            customBlocks.push({ type: v.type, start: v.loc.start.line, end: v.loc.end.line });
            break;
        }
      }
    }

    let currentSplitCount = 0;

    if (scriptBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(scriptBlocks[0].start - 1, scriptBlocks[0].end - 1));

      if (templateBlocks.length >= 1) await foldingSFCBlock(templateBlocks);
      if (styleBlocks.length >= 1) await foldingSFCBlock(styleBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (templateBlocks.length >= 1) {
      await workspace.jumpTo(
        doc.textDocument.uri,
        Position.create(templateBlocks[0].start - 1, templateBlocks[0].end - 1)
      );

      if (scriptBlocks.length >= 1) await foldingSFCBlock(scriptBlocks);
      if (styleBlocks.length >= 1) await foldingSFCBlock(styleBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (styleBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(styleBlocks[0].start - 1, styleBlocks[0].end - 1));

      if (scriptBlocks.length >= 1) await foldingSFCBlock(scriptBlocks);
      if (templateBlocks.length >= 1) await foldingSFCBlock(templateBlocks);
      if (customBlocks.length >= 1) await foldingSFCBlock(customBlocks);

      currentSplitCount++;
      await doSplitWindow(blocksSet.length, currentSplitCount);
    }

    if (customBlocks.length >= 1) {
      await workspace.jumpTo(doc.textDocument.uri, Position.create(customBlocks[0].start - 1, customBlocks[0].end - 1));

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
  const splitDocDescriptor = computed(
    () => parse(splitDocText.value, { sourceMap: false, ignoreEmpty: false }).descriptor
  );

  return getDescriptor;

  function getDescriptor(text: string) {
    splitDocText.value = text;
    return splitDocDescriptor.value;
  }
}

async function foldingSFCBlock(blockRanges: SimpleSFCBlock[]) {
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
