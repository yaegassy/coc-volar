import * as preview from '@volar/preview';
import * as shared from '@volar/shared';
import { parse, SFCParseResult } from '@vue/compiler-sfc';
import * as coc from 'coc.nvim';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(context: coc.ExtensionContext) {

	let ws: ReturnType<typeof preview.createPreviewWebSocket> | undefined;
	let highlightDomElements = true;

	// TODO: this is use for trigger codeLens update, do coc support this?
	const onDidChangeCodeLensesEmmiter = new coc.EventEmitter<void>();

	if (coc.window.terminals.some(terminal => terminal.name.startsWith('volar-preview:'))) {
		ws = preview.createPreviewWebSocket({
			goToCode: handleGoToCode,
			// TODO: use vscode:// to open vscode, can it work with something like vim://xxx ?
			getOpenFileUrl: (fileName, range) => 'vscode://files:/' + fileName,
		});
		onDidChangeCodeLensesEmmiter.fire();
	}
	coc.window.onDidOpenTerminal(e => {
		if (e.name.startsWith('volar-preview:')) {
			ws = preview.createPreviewWebSocket({
				goToCode: handleGoToCode,
				// TODO: same to line 19
				getOpenFileUrl: (fileName, range) => 'vscode://files:/' + fileName,
			});
			onDidChangeCodeLensesEmmiter.fire();
		}
	});
	coc.window.onDidCloseTerminal(e => {
		if (e.name.startsWith('volar-preview:')) {
			ws?.stop();
			ws = undefined;
			onDidChangeCodeLensesEmmiter.fire();
		}
	});

	const sfcs = new WeakMap<coc.Document, { version: number, sfc: SFCParseResult; }>();

	context.subscriptions.push(coc.commands.registerCommand('volar.action.vite', async () => {
		const editor = coc.window.activeTextEditor;
		if (editor) {
			openPreview(uriToFsPath(editor.document.uri), 'vite');
		}
	}));
	context.subscriptions.push(coc.commands.registerCommand('volar.action.nuxt', async () => {
		const editor = coc.window.activeTextEditor;
		if (editor) {
			openPreview(uriToFsPath(editor.document.uri), 'nuxt');
		}
	}));
	// TODO: cannot update dom elements highlight with change code selection due to onDidChangeTextEditorSelection missing
	context.subscriptions.push(coc.window.onDidChangeTextEditorSelection(e => {
		updateSelectionHighlights(e.textEditor);
	}));
	context.subscriptions.push(coc.workspace.onDidChangeTextDocument(e => {
		if (coc.window.activeTextEditor) {
			updateSelectionHighlights(coc.window.activeTextEditor);
		}
	}));
	context.subscriptions.push(coc.workspace.onDidSaveTextDocument(e => {
		if (coc.window.activeTextEditor) {
			updateSelectionHighlights(coc.window.activeTextEditor);
		}
	}));

	class PreviewCodeLens implements coc.CodeLensProvider {
		provideCodeLenses(document: coc.TextDocument, token: coc.CancellationToken): coc.ProviderResult<coc.CodeLens[]> {

			const codeLens: coc.CodeLens[] = [];

			if (ws) {
				codeLens.push({
					range: {
						start: document.positionAt(0),
						end: document.positionAt(0),
					},
					command: {
						title: 'highlight dom elements ' + (highlightDomElements ? '☑' : '☐'),
						command: 'volar.toggleHighlightDomElementsStatus',
					},
				});
			}
			else if (coc.window.activeTextEditor) {

				const viteConfigFile = getConfigFile(uriToFsPath(coc.window.activeTextEditor.document.uri), 'vite');
				const nuxtConfigFile = getConfigFile(uriToFsPath(coc.window.activeTextEditor.document.uri), 'nuxt');

				if (viteConfigFile !== undefined) {
					codeLens.push({
						range: {
							start: document.positionAt(0),
							end: document.positionAt(0),
						},
						command: {
							title: 'preview vite app',
							command: 'volar.action.vite',
						},
					});
				}

				if (nuxtConfigFile !== undefined) {
					codeLens.push({
						range: {
							start: document.positionAt(0),
							end: document.positionAt(0),
						},
						command: {
							title: 'preview nuxt app',
							command: 'volar.action.nuxt',
						},
					});
				}
			}

			return codeLens;
		};
		// TODO: does coc have support this?
		onDidChangeCodeLenses = onDidChangeCodeLensesEmmiter.event;
	}

	coc.languages.registerCodeLensProvider(
		[{ scheme: 'file', language: 'vue' }],
		new PreviewCodeLens(),
	);

	coc.commands.registerCommand('volar.toggleHighlightDomElementsStatus', () => {
		highlightDomElements = !highlightDomElements;
		if (coc.window.activeTextEditor) {
			updateSelectionHighlights(coc.window.activeTextEditor);
		}
		onDidChangeCodeLensesEmmiter.fire();
	});

	function getSfc(document: coc.Document) {
		let cache = sfcs.get(document);
		if (!cache || cache.version !== document.version) {
			cache = {
				version: document.version,
				sfc: parse(document.content, { sourceMap: false, ignoreEmpty: false }),
			};
			sfcs.set(document, cache);
		}
		return cache.sfc;
	}

	function updateSelectionHighlights(textEditor: coc.TextEditor) {
		if (textEditor.document.languageId === 'vue' && highlightDomElements) {
			const sfc = getSfc(textEditor.document);
			const offset = sfc.descriptor.template?.loc.start.offset ?? 0;
			// TODO: TextEditor do not provide selection ranges, use visibleRanges instead of to test for now
			const selections = textEditor.visibleRanges;
			ws?.highlight(
				uriToFsPath(textEditor.document.uri),
				selections.map(selection => ({
					start: textEditor.document.getOffset(selection.start.line, selection.start.character) - offset,
					end: textEditor.document.getOffset(selection.end.line, selection.end.character) - offset,
				})),
				textEditor.document.dirty,
			);
		}
		else {
			ws?.unhighlight();
		}
	}

	async function openPreview(fileName: string, mode: 'vite' | 'nuxt') {

		const configFile = await getConfigFile(fileName, mode);
		if (!configFile)
			return;

		let terminal = coc.window.terminals.find(terminal => terminal.name.startsWith('volar-preview:'));
		let port: number;

		if (terminal) {
			port = Number(terminal.name.split(':')[1]);
		}
		else {
			const configDir = path.dirname(configFile);
			const server = await startPreviewServer(configDir, mode);
			terminal = server.terminal;
			port = server.port;
		}

		terminal.show();
		// TODO: open `http://localhost:${port}` in browser
	}

	async function handleGoToCode(fileName: string, range: [number, number], cancleToken: { readonly isCancelled: boolean; }) {

		const doc = await coc.workspace.openTextDocument(fileName);

		if (cancleToken.isCancelled)
			return;

		// TODO: need to call show document after openTextDocument?
		await coc.window.showTextDocument(doc, coc.ViewColumn.One);

		if (cancleToken.isCancelled)
			return;

		const editor = coc.window.activeTextEditor;
		if (editor) {
			// TODO: not found api to change selection
			const sfc = getSfc(doc);
			const offset = sfc.descriptor.template?.loc.start.offset ?? 0;
			const start = doc.positionAt(range[0] + offset);
			const end = doc.positionAt(range[1] + offset);
			editor.selection = new coc.Selection(start, end);
			editor.revealRange(new coc.Range(start, end));
		}
	}

	async function startPreviewServer(viteDir: string, type: 'vite' | 'nuxt') {

		const port = await shared.getLocalHostAvaliablePort(coc.workspace.getConfiguration('volar').get('preview.port') ?? 3333);
		const terminal = await coc.window.createTerminal({ name: 'volar-preview:' + port });
		const viteProxyPath = type === 'vite'
			? require.resolve('@volar/preview/bin/vite', { paths: [context.extensionPath] })
			: require.resolve('@volar/preview/bin/nuxi', { paths: [context.extensionPath] });

		terminal.sendText(`cd ${viteDir}`);

		if (type === 'vite')
			terminal.sendText(`node ${JSON.stringify(viteProxyPath)} --port=${port}`);
		else
			terminal.sendText(`node ${JSON.stringify(viteProxyPath)} dev --port ${port}`);

		return {
			port,
			terminal,
		};
	}

	function getConfigFile(fileName: string, mode: 'vite' | 'nuxt') {
		let dir = path.dirname(fileName);
		let configFile: string | undefined;
		while (true) {
			const configTs = path.join(dir, mode + '.config.ts');
			const configJs = path.join(dir, mode + '.config.js');
			if (fs.existsSync(configTs)) {
				configFile = configTs;
				break;
			}
			if (fs.existsSync(configJs)) {
				configFile = configJs;
				break;
			}
			const upperDir = path.dirname(dir);
			if (upperDir === dir) {
				break;
			}
			dir = upperDir;
		}
		return configFile;
	}
}

function uriToFsPath(uri: string) {
	return coc.Uri.parse(uri).fsPath;
}
