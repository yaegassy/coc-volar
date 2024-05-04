# coc-volar

> fork from a [vuejs/language-tools/extensions/vscode](https://github.com/vuejs/language-tools/tree/master/extensions/vscode)


[Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=vue.volar) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)
<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/130296846-72ff5989-5853-46fb-a053-a979f7041b99.gif">

## Install

```vim
:CocInstall @yaegassy/coc-volar
```

> scoped packages

## Note

- `coc-volar` version `v0.35.0` and later uses `vue-language-server` version `v2.x.x`. If you have `coc-typescript-vue-plugin` installed, please uninstall it as it will cause conflicts and errors.
  - `:CocUninstall @yaegassy/coc-typescript-vue-plugin`
- To utilize various language features such as `IntelliSense`, `Diagnostics`, and more in the `<script>` blocks of `Vue` files, you need to install either `coc-tsserver` or `coc-tsserver-dev`.
  - `:CocInstall coc-tsserver` or `:CocInstall coc-tsserver-dev`
  - **Note**: `coc-volar` checks if `coc-tsserver` or `coc-tsserver-dev` are installed in the environment when opening a `Vue` file. If they are installed, `coc-volar` automatically starts `tsserver`.
- If you have a project that previously enabled `Takeover mode` using the `volar.initializeTakeOverMode` command in `coc-volar`, you need to perform the following steps:
  - The file `.vim/coc-settings.json` should have been created in the project root directory. In that file, the `tsserver.enable` setting is set to `false`. Please change it to `true`.

    **.vim/coc-settings.json**:

    ```jsonc
    {
      // ...snip
      //"tsserver.enable": false // <-- Before 
      "tsserver.enable": true // <-- After | Change it to `true`, or delete this line.
    }
    ```

## [RECOMMENDED] Additional installation of "watchman"

In the `@vue/language-server` used by `coc-volar`, it utilizes the `workspace/didChangeWatchedFiles` notification to watch files within the project.

In coc.nvim, it is recommended to install [watchman](https://facebook.github.io/watchman/) in order to utilize this feature.

- See: <https://github.com/neoclide/coc.nvim/wiki/Using-coc-extensions>

If you have difficulty installing `watchman`, you can use `coc-volar` without `watchman`, but you may not be able to immediately use volar's IntelliSense with the newly added files.

In this case, please execute the command to restart the language server.

- `:CocRestart`

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
- `volar.disableCompletion`: Disable completion from Volar, default: `false`
- `volar.disableDiagnostics`: Disable diagnostics from Volar, default: `false`
- `volar.disableFormatting`: Disable formatting from Volar, default: `false`
- `volar.disableProgressNotifications`: Disable the initialization and workdone progress notifications, default: `false`
- `vue.trace.server`: Traces the communication between coc.nvim and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `vue.server.path`: Custom path to volar server module, `~` and `$HOME` can also be used. If there is no setting, the built-in module will be used, default: `null`
- `vue.server.maxFileSize`: Maximum file size for Vue Language Server to load. (default: 20MB), default: `20971520`
- `vue.server.maxOldSpaceSize`: Set `--max-old-space-size` option on server process. If you have problem on frequently `"Request textDocument/** failed."` error, try setting higher memory(MB) on it, default: `null`
- `vue.codeActions.enabled`: Enabled code actions, default: `true`
- `vue.codeLens.enabled`: Enabled code lens, default: `true`
- `vue.complete.casing.tags`: Preferred tag name case, valid options: `["autoKebab", "autoPascal", "kebab", "pascal"]`, default: `"autoPascal"`
- `vue.complete.casing.props`: Preferred attr name case, valid options: `["autoKebab", "autoCamel", "kebab", "camel"]`, default: `"autoKebab"`
- `vue.autoInsert.parentheses`: Auto-wrap `()` to As Expression in interpolations for fix volar-issue #520, default: `true`
- `vue.autoInsert.dotValue`: Auto-complete Ref value with `.value`, default: `false`
- `vue.autoInsert.bracketSpacing`: Auto add space between double curly brackets: `{{|}} -> {{ | }}`, default: `true`
- `vue.inlayHints.missingProps`: Show inlay hints for missing required props, `false`
- `vue.inlayHints.inlineHandlerLeading`: Show inlay hints for event argument in inline handlers, default: `false`
- `vue.inlayHints.optionsWrapper`: Show inlay hints for component options wrapper for type support, default: `false`

## Commands

- `vue.action.restartServer`: Restart Vue server

## More features

Other major LSP feature are of course supported as well.

> completion, definition, typeDefinition, diagnostics, hover, signatureHelp, references, codeLens, formatting, rename and more...

## Thanks

- [vuejs/language-tools](https://github.com/vuejs/language-tools)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
