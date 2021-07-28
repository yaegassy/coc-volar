# [Experimental] coc-volar-experimental

> fork from a [@volar/vscode-client](https://github.com/johnsoncodehk/volar/tree/master/packages/vscode-client)

<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/126975753-8d3f1157-c73a-4100-95db-412329151b2a.gif">

[Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (Fast Vue Language Support) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Sorry

This repository is for **experimental** purposes only.

The screenshot looks like it is working to some extent, but unfortunately there are various problems.

- Requires a Visual Studio Code application.
- Requires installation of Visual Studio Code's volar extension.
  - The situation may change once [@volar/vscode-server](https://github.com/johnsoncodehk/volar/tree/master/packages/vscode-server) is published to the npm registry.
- and more...

---

- "Diagnostics" are now working properly. | [DEMO](https://github.com/yaegassy/coc-volar/pull/1)

---

Various may work if you port the [@volar/vscode-client features](https://github.com/johnsoncodehk/volar/tree/master/packages/vscode-client/src/features) correctly.

Help wanted!

## Install

**vim-plug**:

```vim
Plug 'yaegassy/coc-volar-experimental', {'do': 'yarn install --frozen-lockfile'}
```

**CocInstall**:

> Not supported

## Require: Setup

**Preparation**:

- Install Visual Studio Code.
- Install the [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) extension in Visual Studio Code
- Install `coc-html` for HTML tag completion in `<template>`
  - `:CocInstall coc-html`

**Setting (coc-settings.json)**:

- (coc-volar): Set `volar.appRoot.path` to the path of your "Visual Studio Code" application
  - e.g: `/Applications/Visual Studio Code.app/Contents/Resources/app`
- (coc-volar): Set `volar.server.path` to the path of your volar extension server module path
  - e.g: `/path/to/.vscode/extensions/johnsoncodehk.volar-0.26.9/node_modules/@volar/vscode-server/out/server.js`
- (coc-html): Add `vue` to the `html.filetypes` setting.

```jsonc
{
  // ...snip
  "volar.appRoot.path": "/Applications/Visual Studio Code.app/Contents/Resources/app",
  "volar.server.path": "/path/to/.vscode/extensions/johnsoncodehk.volar-0.26.9/node_modules/@volar/vscode-server/out/server.js",
  "html.filetypes": [
    "html",
    "handlebars",
    "htmldjango",
    "blade",
    "vue"
  ],
  // ...snip
}
```

## Configuration options

- `volar.enable`: Enable coc-volar extension, default: `true`
- `volar.server.path`: Volar server path, default: `""`,
- `volar.appRoot.path`: Visual Studio Code application path, default: `""`,
- `volar.display.language`: Display Language (locale), See: https://code.visualstudio.com/docs/getstarted/locales, valid options `["en", "zh-CN", "zh-TW", "fr", "de", "it", "es", "ja", "ko", "ru", "bg", "hu", "pt-br", "tr"]`, default: `"en"`

The rest of the settings are the same as for VSCode's volar extension.

## Commands

- `volar.action.restartServer`: Restart Vue server
- `volar.action.verifyAllScripts`: Verify All Scripts
- `volar.action.removeRefSugars`: Remove All Ref Sugar in Project
- `volar.action.writeTemplateLsVirtualFiles`: Write Template LS Virtual Files
- `volar.action.writeScriptLsVirtualFiles`: Write Script LS Virtual Files
- `volar.action.createWorkspaceSnippets`: Create Workspace Snippets

## Thanks

- [volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
