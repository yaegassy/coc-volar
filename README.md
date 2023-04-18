# coc-volar

> fork from a [vscode-vue](https://github.com/vuejs/language-tools/tree/master/packages/vscode-vue)


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

`coc-volar` has also already added `vite.config.ts`, `vite.config.js`, `vue.config.js` or `nuxt.config.ts` to the extension side to resolve workspace root.

If further customization is needed, set `b:coc_root_patterns` in ".vimrc/init.vim".

**Example**:

```vim
  au FileType vue let b:coc_root_patterns = ['.git', '.env', 'package.json', 'tsconfig.json', 'jsconfig.json', 'vite.config.ts', 'vite.config.js', 'vue.config.js', 'nuxt.config.ts']
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
- `volar.autoCreateQuotes`: Enable/disable auto creation of quotes for HTML attribute assignment, default: `false`
- `volar.autoClosingTags`: Enable/disable autoClosing of HTML tags, default: `false`
- `volar.scaffoldSnippets.enable`: Enable/disable scaffold snippets completion. Typing `vue` or `vuedc` will output completion suggestions. This snippets completion feature will only work on the first line of the file, default: `true`
- `volar.disableDiagnostics`: Disable diagnostics from Volar, default: `false`
- `volar.disableFormatting`: Disable formatting from Volar, default: `false`
- `volar.disableProgressNotifications`: Disable the initialization and workdone progress notifications, default: `false`
- `volar.dev.serverPath`: (For develop and check) Custom path to volar server module, `~` and `$HOME`, etc. can also be used. If there is no setting, the built-in module will be used, default: `""`
- `vue-semantic-server.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `vue-syntactic-server.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar.vueserver.configFilePath`: Path to volar.config.js, default: `./volar.config.js`
- `volar.vueserver.maxFileSize`: Maximum file size for Vue Server to load. (default: 20MB), default: `20971520`
- `volar.vueserver.petiteVue.processHtmlFile`: Recognize `.html` extension as PetiteVue file format. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, and adding `__PATH_TO_HTML_FILES_/*.html` to config include option, default: `false`
- `volar.vueserver.vitePress.processMdFile`: Recognize `.md` extension as VitePress file format. If you use this setting, it is recommended to enable it at the workspace (project) level. You must also place `tsconfig.json` or `jsconfig.json` in your project, and adding `__PATH_TO_MD_FILES_/*.md` to config include option, default: `false`
- `volar.vueserver.diagnosticModel`: Diagnostic update model, valid option: `["push", "pull"]`, default: `push`
- `volar.vueserver.maxOldSpaceSize`: Set `--max-old-space-size` option on server process. Maximum memory (in MB) that the server should use. On some systems this may only have effect when runtime has been set. Minimum 256.
- `volar.vueserver.reverseConfigFilePriority`: Reverse priority for tsconfig pickup, default: `false`
- `volar.vueserver.additionalExtensions`: List any additional file extensions that should be processed as Vue files (requires restart), default: `[]`
- `volar.vueserver.fullCompletionList`: Enable this option if you want to get complete CompletionList in language client. (Disable for better performance), default: `false`
- `volar.takeOverMode.enabled`: Take over language support for `*.ts`, default: `false`
- `volar.format.initialIndent`: Whether to have initial indent, default: `{ "html": true }`
- `vue.features.codeActions.enable`: Enabled code actions, default: `true`
- `vue.features.codeLens.enable`: Enabled code lens, default: `true`
- `vue.features.complete.tagNameCasing`: Preferred tag name case, valid options: `["autoKebab", "autoPascal", "kebab", "pascal"]`, default: `"autoPascal"`
- `vue.features.complete.propNameCasing`: Preferred attr name case, valid options: `["autoKebab", "autoCamel", "kebab", "camel"]`, default: `"autoKebab"`
- `vue.features.complete.normalizeComponentImportName`: Normalize import name for auto import. (\"myCompVue\" -> \"MyComp\"), default: `true`
- `vue.features.autoInsert.parentheses`: Auto-wrap `()` to As Expression in interpolations for fix volar-issue #520, default: `true`
- `vue.features.autoInsert.dotValue`: Auto-complete Ref value with `.value`, default: `false`
- `vue.features.autoInsert.bracketSpacing`: Auto add space between double curly brackets: `{{|}} -> {{ | }}`, default: `true`
- `vue.features.inlayHints.missingProps`: Show inlay hints for missing required props, `false`
- `vue.features.inlayHints.inlineHandlerLeading`: Show inlay hints for event argument in inline handlers, default: `false`

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

- [vuejs/language-tools](https://github.com/vuejs/language-tools)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
