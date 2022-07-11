# coc-volar

> fork from a [vscode-vue-language-features](https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-vue-language-features)

[Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (Fast Vue Language Support) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)
<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/130296846-72ff5989-5853-46fb-a053-a979f7041b99.gif">

## Install

**CocInstall**:

```vim
:CocInstall @yaegassy/coc-volar
```

> scoped packages

**vim-plug**:

```vim
Plug 'yaegassy/coc-volar', {'do': 'yarn install --frozen-lockfile'}
```

## (Optional) Additional installation of coc-extension

If you want to use `volar.action.splitEditors`, `volar.action.vite`, `volar.action.nuxt` and other feature, please install [coc-volar-tools](https://github.com/yaegassy/coc-volar-tools).

**CocInstall**:

```vim
:CocInstall @yaegassy/coc-volar-tools
```

> scoped packages

**vim-plug**:

```vim
Plug 'yaegassy/coc-volar-tools', {'do': 'yarn install --frozen-lockfile'}
```

## Recommended additional installation: "watchman"

`coc-volar` uses the `fileEvents` option to watch files in the project, it is recommended to install [watchman](https://facebook.github.io/watchman/).

- See: <https://github.com/neoclide/coc.nvim/wiki/Using-coc-extensions>

If you have difficulty installing watchman, you can use coc-volar without watchman, but you may not be able to immediately use volar's IntelliSense with the newly added files.

In this case, please execute the command to restart the language server.

- `:CocRestart`

## workspaceFolders

Depending on the project like mono repo or how Vim/Neovim is started, `workspaceFolders` may not be recognized correctly.

If `workspaceFolders` are not recognized correctly, the language server may parse unnecessary project folders, etc., slowing down the operation. Or Language Server may not work properly.

The default configuration of coc.nvim resolves to the directory where the `.git`, `.hg`, or `.projections.json` files reside as the workspace root.

`coc-volar` has also already added `vite.config.ts`, `vue.config.js` or `nuxt.config.ts` to the extension side to resolve workspace root.

If further customization is needed, set `b:coc_root_patterns` in ".vimrc/init.vim".

**Example**:

```vim
  au FileType vue let b:coc_root_patterns = ['.git', '.env', 'package.json', 'tsconfig.json', 'jsconfig.json', 'vite.config.ts', 'vue.config.js', 'nuxt.config.ts']
```

For more information, check this coc.nvim's wiki.

- <https://github.com/neoclide/coc.nvim/wiki/Using-workspaceFolders>

## Usage & Notes

**See**:

- <https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-vue-language-features#usage>
- <https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-vue-language-features#notes>

## How to enable "Take Over Mode" in coc-volar

### If you are using "Take Over Mode" for the first time in your project

1. To begin, open the `*.vue`, `*.ts`, `*.js`, `*.tsx`, `*.jsx` file.
1. Then run `:CocCommand volar.initializeTakeOverMode`.
1. When prompted by `Enable Take Over Mode? (y/n)?`, enter `y`
1. The `.vim/coc-settings.json` file will be created in the "project root".
   - The `"volar.takeOverMode.enabled": true` and `"tsserver.enable": false` settings will be added.
1. `coc.nvim` will be restarted and the settings will be reflected.

### If you want to disable Take Over Mode for a project

Delete the `.vim/coc-settings.json` file in the "project root", and start Vim again.

## VitePress and petite-vue support

Notes for make `VitePress`, `petite-vue` project working with Volar.

### VitePress

- Set `volar.vitePressSupport.enable` to `true` in `.vim/coc-settings.json`.
  - **[WARNING]** If you use this setting, it is recommended to enable it at the workspace (project) level.
- `vue` is optional add in devDependencies for better intellisense.
- Make sure added related `.md` files path to tsconfig.json `include` property
- Usually needed `"allowJs": true` and `"jsx": "preserve"` config.

### petite-vue

- Set `volar.petiteVueSupport.enable` to `true` in `.vim/coc-settings.json`.
  - **[WARNING]** If you use this setting, it is recommended to enable it at the workspace (project) level.
- Set `html.enable` to `false` in `.vim/coc-settings.json`.
- `vue` is optional add in devDependencies for better intellisense.
- Make sure added related `.html` files path to tsconfig.json `include` property
- Usually needed `"allowJs": true` and `"jsx": "preserve"` config.

## Formatter

If `coc-prettier` (v9.2.0 later) is installed, `prettier` will be run as the formatter.

If you want to use the volar's built-in formatter, set `prettier.enable` to `false` or set `prettier.disableLanguages` to `vue` in `.vim/coc-settings.json`.

**Example1**:

```jsonc
{
  "prettier.enable": false
}
```

**Example2**:

```jsonc
{
  "prettier.disableLanguages": [
    "vue"
  ]
}
```

It can also be controlled by other `coc-prettier` settings and `.prettierignore` files.

Check the README of `coc-prettier` for details. <https://github.com/neoclide/coc-prettier/blob/master/Readme.md>

## Configuration options

- `volar.enable`: Enable coc-volar extension, default: `true`
- `volar.useWorkspaceTsdk`: Use workspace (project) detected tsLibs in volar. if false, use coc-volar's built-in tsLibs, default: `false`
- `volar.scaffoldSnippets.enable`: Enable/disable scaffold snippets completion. Typing `vue` or `vuedc` will output completion suggestions. This snippets completion feature will only work on the first line of the file, default: `true`
- `volar.diagnostics.enable`: Enable/disable the Volar diagnostics, default: `true`
- `volar.diagnostics.tsLocale`: Locale of diagnostics messages from typescript, valid option: `["cs", "de", "es", "fr", "it", "ja", "ko", "en", "pl", "pt-br", "ru", "tr", "zh-cn", "zh-tw"]`, default: `"en"`
- `volar.inlayHints.enable`: Whether to show inlay hints. In order for inlayHints to work with volar, you will need to further configure `typescript.inlayHints.*` or `javascript.inlayHints.*` settings, default: `true`
- `volar.vitePressSupport.enable`: Use `.md` instead of `.vue` for file extension. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, default: `false`
- `volar.petiteVueSupport.enable`: Use `.html` instead of `.vue` for file extension. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, default: `false`
- `volar.progressOnInitialization.enable`: Enable/disable progress window at language server startup, default: `true`
- `volar-language-features.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar-language-features-2.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar-document-features.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar.vueserver.useSecondServer`: Use second server to progress heavy diagnostic works, the main server workhorse computing intellisense, operations such as auto-complete can respond faster. Note that this will lead to more memory usage, default: `true`
- `volar.vueserver.maxOldSpaceSize`: Set `--max-old-space-size` option on server process. Maximum memory (in MB) that the server should use. On some systems this may only have effect when runtime has been set. Minimum 256.
- `volar.takeOverMode.enabled`: Take over language support for *.ts, default: `false`
- `volar.codeLens.references`: [references] code lens, default: `true`
- `volar.codeLens.pugTools`: [pug ☐] code lens, default: `false`
- `volar.codeLens.scriptSetupTools`: [ref sugar ☐] code lens, default: `false`
- `volar.autoCreateQuotes`: Enable/disable auto creation of quotes for HTML attribute assignment, default: `false`
- `volar.autoClosingTags`: Enable/disable autoClosing of HTML tags, default: `false`
- `volar.autoCompleteRefs`: Auto-complete Ref value with '.value', default: `false`
- `volar.formatting.enable`: Enable/disable the Volar document formatter, default: `true`
- `volar.completion.tagNameCase`: Tag name case, valid options: `["both", "kebab", "pascal"]`, default: `"both"`
- `volar.completion.attrNameCase`: Attr name case, valid options: `["kebab", "camel"]`, default: `"kebab"`
- `volar.completion.autoImportComponent`: Enabled auto-import for component with tag completion, default: `true`
- `volar.dev.serverPath`: (For develop and check) Custom path to volar server module, `~` and `$HOME`, etc. can also be used. If there is no setting, the built-in module will be used, default: `""`

## Commands

- `volar.initializeTakeOverMode`: Enable Take Over Mode in your project
- `volar.toggleInlayHints`: Toggle inlay hints Enable/Disable
- `volar.action.doctor`: Show Doctor info
- `volar.action.restartServer`: Restart Vue server
- `volar.action.verifyAllScripts`: Verify All Scripts
- `volar.action.splitEditors`: Split `<script>`, `<template>`, `<style>` Editors
  - Please install [coc-volar-tools](https://github.com/yaegassy/coc-volar-tools) separately to use this command
- `volar.action.vite`: Experimental Features for Vite
  - Please install [coc-volar-tools](https://github.com/yaegassy/coc-volar-tools) separately to use this command
- `volar.action.nuxt`: Experimental Features for Nuxt
  - Please install [coc-volar-tools](https://github.com/yaegassy/coc-volar-tools) separately to use this command
- `volar.vue.findAllFileReferences`: Vue: Find File References

## More features

Other major LSP feature are of course supported as well.

> completion, definition, typeDefinition, diagnostics, hover, signatureHelp, references, codeLens, formatting, rename and more...

## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
