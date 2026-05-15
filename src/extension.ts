import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { startServer } from './serverController';
import { WebviewManager } from './webviewManager';
import { setWizBaseUrl } from './wiz-commands';

export type ServerLocation = 'remote' | 'local';
export type ServerType = 'binary' | 'jar';

declare const __WIZ_SERVER_LOCATION__: ServerLocation;
declare const __WIZ_SERVER_TYPE__: ServerType;
declare const __WIZ_SERVER_PORT__: number;
declare const __WIZ_BASE_URL__: string;

const serverLocation: ServerLocation = __WIZ_SERVER_LOCATION__;
const serverType: ServerType = __WIZ_SERVER_TYPE__;
const serverPort = __WIZ_SERVER_PORT__;
const wizBaseUrl = __WIZ_BASE_URL__;

let languageClient: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	setWizBaseUrl(wizBaseUrl);

	// Start Wiz server if local
	if (serverLocation === 'local') {
		startServer(context.extensionPath, serverType, serverPort);
	}

	// Start Language Server for WhileStar files
	languageClient = startLanguageClient(context);

	const webviewManager = new WebviewManager(context);

	// Register commands
	const openCommandHandler = vscode.commands.registerCommand('whileStar.openInterpreter', async () => {
		try {
			await webviewManager.openWebview();
		} catch (error) {
			console.error('Error opening interpreter:', error);
		}
	});

	const runCommandHandler = vscode.commands.registerCommand('whileStar.run', async () => {
		try {
			await webviewManager.executeRun();
		} catch (error) {
			console.error('Error running command:', error);
		}
	});

	const debugCommandHandler = vscode.commands.registerCommand('whileStar.debug', async () => {
		try {
			await webviewManager.executeDebug();
		} catch (error) {
			console.error('Error debugging command:', error);
		}
	});

	const tcCommandHandler = vscode.commands.registerCommand('whileStar.tc', async () => {
		try {
			await webviewManager.executeTc();
		} catch (error) {
			console.error('Error type checking:', error);
		}
	});

	const proofCommandHandler = vscode.commands.registerCommand('whileStar.proof', async () => {
		try {
			await webviewManager.executeProof();
		} catch (error) {
			console.error('Error generating proof:', error);
		}
	});

	const livenessCommandHandler = vscode.commands.registerCommand('whileStar.livenessAnalysis', async () => {
		try {
			await webviewManager.executeAnalysis('liveness-analysis');
		} catch (error) {
			console.error('Error running liveness analysis:', error);
		}
	});

	const reachabilityCommandHandler = vscode.commands.registerCommand('whileStar.reachabilityAnalysis', async () => {
		try {
			await webviewManager.executeAnalysis('reachability-analysis');
		} catch (error) {
			console.error('Error running reachability analysis:', error);
		}
	});

	const rdCommandHandler = vscode.commands.registerCommand('whileStar.rdAnalysis', async () => {
		try {
			await webviewManager.executeAnalysis('rd-analysis');
		} catch (error) {
			console.error('Error running reaching definitions analysis:', error);
		}
	});

	const taintCommandHandler = vscode.commands.registerCommand('whileStar.taintAnalysis', async () => {
		try {
			await webviewManager.executeAnalysis('taint-analysis');
		} catch (error) {
			console.error('Error running taint analysis:', error);
		}
	});

	const transitionCfgCommandHandler = vscode.commands.registerCommand('whileStar.transitionCfg', async () => {
		try {
			await webviewManager.executeTransitionCfg();
		} catch (error) {
			console.error('Error generating transition CFG:', error);
		}
	});

	context.subscriptions.push(
		openCommandHandler,
		runCommandHandler,
		debugCommandHandler,
		tcCommandHandler,
		proofCommandHandler,
		livenessCommandHandler,
		reachabilityCommandHandler,
		rdCommandHandler,
		taintCommandHandler,
		transitionCfgCommandHandler,
		webviewManager,
		languageClient
	);
}

export function deactivate(): Thenable<void> | undefined {
	if (languageClient) {
		return languageClient.stop();
	}
	return undefined;
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
	const serverModule = context.asAbsolutePath(path.join('out', 'language-server', 'main.js'));

	// The debug options for the server
	const debugOptions = {
		execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`]
	};

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for WhileStar documents
		documentSelector: [{ scheme: 'file', language: 'while-star' }],
		synchronize: {
			// Notify the server about file changes to '.wstar' files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.wstar')
		}
	};

	// Create the language client and start the client.
	const client = new LanguageClient(
		'whileStarLanguageServer',
		'WhileStar Language Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
	return client;
}
