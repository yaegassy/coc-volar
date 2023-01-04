# coc-volar

> fork from a [vscode-vue](https://github.com/johnsoncodehk/volar/tree/master/vue-language-tools/vscode-vue)

[Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (Fast Vue Language Support) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)
<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/130296846-72ff5989-5853-46fb-a053-a979f7041b99.gif">

## Install

```vim
:CocInstall @yaegassy/coc-volar
```

> scoped packages

## (Optional) Additional installation of coc-extension

If you want to use `volar.action.splitEditors`, `volar.action.vite`, `volar.action.nuxt` and other feature, please install [coc-volar-tools](https://github.com/yaegassy/coc-volar-tools).


```vim
:CocInstall @yaegassy/coc-volar-tools
```

> scoped packages

## [IMPORTANT] Enable "Take Over Mode"

In `coc-volar`, please enable and use "Take Over Mode". Check the Vue.js documentation for more information on "Take Over Mode".

- <https://vuejs.org/guide/typescript/overview.html#volar-takeover-mode>

If you want to use the "TypeScript Vue Plugin" instead of Take Over Mode, install `typescript-vue-plugin` in your project (`npm install typescript-vue-plugin`). After installation, add a setting in `tsconfig.json` to use `typescript-vue-plugin`.

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

- Set `volar.vueserver.vitePress.processMdFile` to `true` in `.vim/coc-settings.json`.
  - **[WARNING]** If you use this setting, it is recommended to enable it at the workspace (project) level.
- `vue` is optional add in devDependencies for better intellisense.
- Make sure added related `.md` files path to tsconfig.json `include` property.

### petite-vue

- Set `volar.vueserver.petiteVue.processHtmlFile` to `true` in `.vim/coc-settings.json`.
  - **[WARNING]** If you use this setting, it is recommended to enable it at the workspace (project) level.
- Set `html.enable` to `false` in `.vim/coc-settings.json`.
- `vue` is optional add in devDependencies for better intellisense.
- Make sure added related `.html` files path to tsconfig.json `include` property.

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

## iskeyword

If the completion menu disappears when typing `-`, add the `iskeyword` setting to `.vimrc` / `init.vim`.

```vim
autocmd Filetype vue setlocal iskeyword+=-
```

## Configuration options

- `volar.enable`: Enable coc-volar extension, default: `true`
- `volar.useWorkspaceTsdk`: Use workspace (project) detected tsLibs in volar. if false, use coc-volar's built-in tsLibs, default: `false`
- `volar.tsLocale`: Sets the locale used to report diagnostics message from typescript, valid option: `["cs", "de", "es", "fr", "it", "ja", "ko", "en", "pl", "pt-br", "ru", "tr", "zh-cn", "zh-tw"]`, default: `"en"`
- `volar.scaffoldSnippets.enable`: Enable/disable scaffold snippets completion. Typing `vue` or `vuedc` will output completion suggestions. This snippets completion feature will only work on the first line of the file, default: `true`
- `volar.disableDiagnostics`: Disable diagnostics from Volar, default: `false`
- `volar.disableFormatting`: Disable formatting from Volar, default: `false`
- `volar.disableProgressNotifications`: Disable the initialization and workdone progress notifications, default: `false`
- `vue-semantic-server.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `vue-syntactic-server.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar.vueserver.configFilePath`: Path to volar.config.js, default: `./volar.config.js`
- `volar.vueserver.maxFileSize`: Maximum file size for Vue Server to load. (default: 20MB), default: `20971520`
- `volar.vueserver.petiteVue.processHtmlFile`: Use `.html` instead of `.vue` for file extension. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, default: `false`
- `volar.vueserver.vitePress.processMdFile`: Use `.md` instead of `.vue` for file extension. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, default: `false`
- `volar.vueserver.json.customBlockSchemaUrls`: preset json schema urls for custom blocks, default: `null`
- `volar.vueserver.textDocumentSync`: Defines how the host (editor) should sync document changes to the language server. SFC incremental parser only working when config "incremental", valid option: `["incremental", "full", "none"]`, default: `incremental`
- `volar.vueserver.diagnosticModel`: Diagnostic update model, valid option: `["push", "pull"]`, default: `push`
- `volar.vueserver.maxOldSpaceSize`: Set `--max-old-space-size` option on server process. Maximum memory (in MB) that the server should use. On some systems this may only have effect when runtime has been set. Minimum 256.
- `volar.vueserver.noProjectReferences`: Ignore project references settings of tsconfig in language server for resolve volar's issue #1916, default: `false`
- `volar.vueserver.reverseConfigFilePriority`: Reverse priority for tsconfig pickup, default: `false`
- `volar.vueserver.disableFileWatcher`: Disable file watcher in language server for better performance, default: `false`
- `volar.vueserver.additionalExtensions`: List any additional file extensions that should be processed as Vue files (requires restart), default: `[]`
- `volar.codeLens.references`: [references] code lens, default: `true`
- `volar.codeLens.pugTools`: [pug ☐] code lens, default: `false`
- `volar.codeLens.scriptSetupTools`: [ref sugar ☐] code lens, default: `false`
- `volar.autoWrapParentheses`: Auto-wrap `()` to As Expression in interpolations for fix issue `#520` of volar, default: `true`
- `volar.autoCreateQuotes`: Enable/disable auto creation of quotes for HTML attribute assignment, default: `false`
- `volar.autoClosingTags`: Enable/disable autoClosing of HTML tags, default: `false`
- `volar.autoCompleteRefs`: Auto-complete Ref value with '.value', default: `false`
- `volar.takeOverMode.enabled`: Take over language support for `*.ts`, default: `false`
- `volar.format.initialIndent`: `volar.format.initialIndent`, default: `{ "html": true }`
- `volar.completion.preferredTagNameCase`: Preferred tag name case, valid options: `["kebab", "pascal"]`, default: `"pascal"`
- `volar.completion.preferredAttrNameCase`: Preferred attr name case, valid options: `["kebab", "camel"]`, default: `"kebab"`
- `volar.completion.normalizeComponentAutoImportName`: Normalize import name for auto import. ("myCompVue" -> "MyComp"), default: `true`
- `volar.updateImportsOnFileMove.enabled`: Enabled update imports on file move, default: `true`
- `volar.diagnostics.delay`: Delay time for diagnostics, default: `200`
- `volar.dev.serverPath`: (For develop and check) Custom path to volar server module, `~` and `$HOME`, etc. can also be used. If there is no setting, the built-in module will be used, default: `""`

## Commands

- `volar.initializeTakeOverMode`: Enable Take Over Mode in your project
- `volar.action.doctor`: Show Doctor info
- `volar.action.restartServer`: Restart Vue server
- `volar.action.reloadProject`: Reload Project
- `volar.action.showVirtualFiles`: Show Virtual Files (Debug)
- `volar.action.serverStats`: Server Stats (Debug)
- `volar.action.showComponentMeta`: Show Component Meta
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
