# coc-volar

> fork from a [@volar/client](https://github.com/johnsoncodehk/volar/tree/master/packages/client)

[Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (Fast Vue Language Support) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/127477834-461c3565-143a-4ce7-bd78-e68b8b304480.gif">

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

## Configuration options

Check the "configuration" section of [package.json](/package.json)

## Commands

- `volar.action.restartServer`: Restart Vue server
- `volar.action.verifyAllScripts`: Verify All Scripts

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


## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
