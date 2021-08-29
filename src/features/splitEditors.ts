import { commands, ExtensionContext, Position, workspace } from 'coc.nvim';
import { ref, computed } from '@vue/reactivity';
import * as html from 'vscode-html-languageservice';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as shared from '@volar/shared';

interface CocVolarSFCBlock {
  lang: string;
  start: number;
  end: number;
}

export const htmlLs = html.getLanguageService();

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.action.splitEditors', onSplit));

  async function onSplit() {
    const getDocDescriptor = useDocDescriptor();

    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    const descriptor = getDocDescriptor(doc.textDocument.getText());
    const blocksSet: shared.SfcBlock[][] = [];

    const scriptBlocks: CocVolarSFCBlock[] = [];
    const templateBlocks: CocVolarSFCBlock[] = [];
    const styleBlocks: CocVolarSFCBlock[] = [];
    const customBlocks: CocVolarSFCBlock[] = [];

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
        switch (v.lang) {
          case 'ts':
            scriptBlocks.push({
              lang: v.lang,
              start: doc.textDocument.positionAt(v.start).line,
              end: doc.textDocument.positionAt(v.end).line,
            });
            break;
          case 'html':
            templateBlocks.push({
              lang: v.lang,
              start: doc.textDocument.positionAt(v.start).line,
              end: doc.textDocument.positionAt(v.end).line,
            });
            break;
          case 'css':
            styleBlocks.push({
              lang: v.lang,
              start: doc.textDocument.positionAt(v.start).line,
              end: doc.textDocument.positionAt(v.end).line,
            });
            break;

          default:
            customBlocks.push({
              lang: v.lang,
              start: doc.textDocument.positionAt(v.start).line,
              end: doc.textDocument.positionAt(v.end).line,
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
  const splitDocDescriptor = computed(() =>
    shared.parseSfc(splitDocText.value, htmlLs.parseHTMLDocument(TextDocument.create('', '', 0, splitDocText.value)))
  );

  return getDescriptor;

  function getDescriptor(text: string) {
    splitDocText.value = text;
    return splitDocDescriptor.value;
  }
}

async function foldingSFCBlock(blockRanges: CocVolarSFCBlock[]) {
  for (const v of blockRanges) {
    ////await workspace.nvim.command(`${v.start},${v.end}fold`);
    await workspace.nvim.command(`${v.start},${v.end + 1}fold`);
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
