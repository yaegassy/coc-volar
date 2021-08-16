import { commands, ExtensionContext, Position, workspace, Document } from 'coc.nvim';

export function activate(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand('volar.action.splitEditors', onSplit));

  async function onSplit() {
    const doc = await workspace.document;
    if (!doc) {
      return;
    }

    let countSFCBlock = 0;
    const scriptTagRange = getTagRange(doc, 'script');
    if (scriptTagRange) countSFCBlock++;
    const templateTagRange = getTagRange(doc, 'template');
    if (templateTagRange) countSFCBlock++;
    const styleTagRange = getTagRange(doc, 'style');
    if (styleTagRange) countSFCBlock++;

    //
    // MEMO: Full SFC
    //
    if (scriptTagRange && templateTagRange && styleTagRange && countSFCBlock === 3) {
      /** 1 */
      await workspace.jumpTo(doc.textDocument.uri, Position.create(scriptTagRange.start, scriptTagRange.end));
      // folding
      await workspace.nvim.command(`${templateTagRange.start + 1},${templateTagRange.end + 1}fold`);
      await workspace.nvim.command(`${styleTagRange.start + 1},${styleTagRange.end + 1}fold`);

      // Vertical split & Open all folds
      await workspace.nvim.command('belowright vsplit || 1,$foldopen');

      /** 2 */
      await workspace.jumpTo(doc.textDocument.uri, Position.create(templateTagRange.start, templateTagRange.end));
      // folding
      await workspace.nvim.command(`${scriptTagRange.start + 1},${scriptTagRange.end + 1}fold`);
      await workspace.nvim.command(`${styleTagRange.start + 1},${styleTagRange.end + 1}fold`);

      // Split & Open all folds
      await workspace.nvim.command('belowright split || 1,$foldopen');

      /** 3 */
      await workspace.jumpTo(doc.textDocument.uri, Position.create(styleTagRange.start, styleTagRange.end));
      // folding
      await workspace.nvim.command(`${scriptTagRange.start + 1},${scriptTagRange.end + 1}fold`);
      await workspace.nvim.command(`${templateTagRange.start + 1},${templateTagRange.end + 1}fold`);
    }

    //
    // MEMO: Two SFC
    //
    if (countSFCBlock == 2) {
      if (scriptTagRange) {
        /** 1 */
        await workspace.jumpTo(doc.textDocument.uri, Position.create(scriptTagRange.start, scriptTagRange.end));

        if (templateTagRange) {
          // folding
          await workspace.nvim.command(`${templateTagRange.start + 1},${templateTagRange.end + 1}fold`);
        }
        if (styleTagRange) {
          // folding
          await workspace.nvim.command(`${styleTagRange.start + 1},${styleTagRange.end + 1}fold`);
        }

        // Vertical split & Open all folds
        await workspace.nvim.command('belowright vsplit || 1,$foldopen');

        /** 2 */
        if (templateTagRange) {
          await workspace.jumpTo(doc.textDocument.uri, Position.create(templateTagRange.start, templateTagRange.end));
          if (scriptTagRange) {
            // folding
            await workspace.nvim.command(`${scriptTagRange.start + 1},${scriptTagRange.end + 1}fold`);
          }
          if (styleTagRange) {
            // folding
            await workspace.nvim.command(`${styleTagRange.start + 1},${styleTagRange.end + 1}fold`);
          }
        } else if (styleTagRange) {
          await workspace.jumpTo(doc.textDocument.uri, Position.create(styleTagRange.start, styleTagRange.end));
          if (scriptTagRange) {
            // folding
            await workspace.nvim.command(`${scriptTagRange.start + 1},${scriptTagRange.end + 1}fold`);
          }
        }
      } else if (templateTagRange) {
        /** 1 */
        await workspace.jumpTo(doc.textDocument.uri, Position.create(templateTagRange.start, templateTagRange.end));

        if (styleTagRange) {
          // folding
          await workspace.nvim.command(`${styleTagRange.start + 1},${styleTagRange.end + 1}fold`);
        }

        // Vertical split & Open all folds
        await workspace.nvim.command('belowright vsplit || 1,$foldopen');

        /** 2 */
        if (styleTagRange) {
          await workspace.jumpTo(doc.textDocument.uri, Position.create(styleTagRange.start, styleTagRange.end));
          // folding
          await workspace.nvim.command(`${templateTagRange.start + 1},${templateTagRange.end + 1}fold`);
        }
      }
    }
  }
}

function getTagRange(doc: Document, tagType: 'script' | 'template' | 'style') {
  let startRegex: RegExp;
  let endRegex: RegExp;

  if (tagType === 'script') {
    startRegex = /^<script/;
    endRegex = /^<\/script>/;
  } else if (tagType === 'template') {
    startRegex = /^<template/;
    endRegex = /^<\/template>/;
  } else if (tagType === 'style') {
    startRegex = /^<style/;
    endRegex = /^<\/style>/;
  } else {
    return;
  }

  const start = getTagLine(doc, startRegex);
  const end = getTagLine(doc, endRegex);

  if (start !== undefined && end !== undefined) {
    return {
      start,
      end,
    };
  }

  return;
}

function getTagLine(doc: Document, regex: RegExp): number | undefined {
  let matchLine: number | undefined;

  const text = doc.textDocument.getText();
  const textArr = text.split('\n');
  textArr.some((line, index) => {
    if (line.match(regex)) {
      matchLine = index;
      return true;
    }
  });

  return matchLine;
}
