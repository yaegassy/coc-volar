# [Experimental] coc-volar

> fork from a [@volar/client](https://github.com/johnsoncodehk/volar/tree/master/packages/client)

<img width="780" alt="coc-volar-demo" src="https://user-images.githubusercontent.com/188642/127477834-461c3565-143a-4ce7-bd78-e68b8b304480.gif">

[Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (Fast Vue Language Support) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Note

This repository is for **experimental** purposes only.

## Install

**vim-plug**:

```vim
Plug 'yaegassy/coc-volar', {'do': 'yarn install --frozen-lockfile'}
```

**CocInstall**:

> Not supported

## Configuration options

The rest of the settings are the same as for VSCode's volar extension.

## Commands

- `volar.action.restartServer`: Restart Vue server
- `volar.action.verifyAllScripts`: Verify All Scripts
- `volar.action.removeRefSugars`: Remove All Ref Sugar in Project
- `volar.action.writeTemplateLsVirtualFiles`: Write Template LS Virtual Files
- `volar.action.writeScriptLsVirtualFiles`: Write Script LS Virtual Files

## Help wanted!

Various may work if you port the [@volar/client features](https://github.com/johnsoncodehk/volar/tree/master/packages/client/src/features) correctly.

## Thanks

- [johnsoncodehk/volar](https://github.com/johnsoncodehk/volar)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
