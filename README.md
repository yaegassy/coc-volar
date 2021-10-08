# coc-volar

> fork from a [@volar/client](https://github.com/johnsoncodehk/volar/tree/master/packages/client)

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

## Using & Note

**See**:

- <https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-vue-language-features#using>
- <https://github.com/johnsoncodehk/volar/tree/master/extensions/vscode-vue-language-features#note>

## Configuration options

- `volar.enable`: Enable coc-volar extension, default: `true`
- `volar.useWorkspaceTsdk`: Use workspace (project) detected tsLibs in volar. if false, use coc-volar's built-in tsLibs, default: `false`
- `volar.diagnostics.enable`: Enable/disable the Volar diagnostics, default: `true`
- `volar.diagnostics.tsLocale`: Locale of diagnostics messages from typescript, valid option: `["cs", "de", "es", "fr", "it", "ja", "ko", "en", "pl", "pt-br", "ru", "tr", "zh-cn", "zh-tw"]`, default: `"en"`
- `volar.maxMemory`: Maximum memory (in MB) that the server should use. On some systems this may only have effect when runtime has been set. Minimum 256.
- `volar-api.trace.server`: Traces the communication between VS Code and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar-document.trace.server`: Traces the communication between VS Code and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar-html.trace.server`: Traces the communication between VS Code and the language server, valid option: `["off", "messages", "verbose"]`, default: `"off"`
- `volar.lowPowerMode`: Using one language server to do the work of two language serves can reduce system resource usage, but features such as auto-complete will be much slower, default: `false`
- `volar.enabledTakeOverMode`: Take over language support for *.ts, default: `false`
- `volar.codeLens.references`: [references] code lens, default: `true`
- `volar.codeLens.pugTools`: [pug ☐] code lens, default: `false`
- `volar.codeLens.scriptSetupTools`: [ref sugar ☐] code lens, default: `false`
- `volar.autoClosingTags`: Enable/disable autoClosing of HTML tags, default: `false`
- `volar.autoCompleteRefs`: Auto-complete Ref value with '.value', default: `false`
- `volar.formatting.enable`: Enable/disable the Volar document formatter, default: `true`
- `volar.formatting.printWidth`: HTML formatting print width, default: `100`
- `volar.tagNameCase`: Tag name case, valid options: `["both", "kebab", "pascal"]`, default: `"both"`
- `volar.attrNameCase`: Attr name case, valid options: `["kebab", "camel"]`, default: `"kebab"`
- `volar.dev.serverPath`: (For develop and check) Custom path to volar server module, `~` and `$HOME`, etc. can also be used. If there is no setting, the built-in module will be used, default: `""`

## Commands

- `volar.doctor`: Show Doctor info
  - You can check the versions and settings of various packages
    - client, server, vue, @vue/runtime-dom, vue-tsc, typescript related, coc-volar's configuration, and more...
- `volar.action.restartServer`: Restart Vue server
- `volar.action.verifyAllScripts`: Verify All Scripts
- `volar.action.splitEditors`: Split `<script>`, `<template>`, `<style>` Editors

## Code Actions

**Example key mappings (Code Action related)**:

```vim
nmap <silent> <leader>a <Plug>(coc-codeaction-cursor)
nmap <silent> ga <Plug>(coc-codeaction-line)
nmap <silent> gA <Plug>(coc-codeaction)
```

See `:h coc-codeaction`

**or Run from CocAction, CocActionAsync**:

```vim
:call CocActionAsync('codeAction', 'cursor')

:call CocActionAsync('codeAction', 'line')

:call CocActionAsync('codeAction', '')
```

**Action Lists (Server side)**:

Various code actions provided by the volar (languageservice)

**Action Lists (Client side) [Experimental]**:

- `Add @ts-ignore for this line`

## More features

Other major LSP feature are of course supported as well.

> completion, definition, typeDefinition, diagnostics, hover, signatureHelp, references, codeLens, formatting, rename and more...

## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
