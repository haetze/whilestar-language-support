import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import {
    AnalysisCommand,
    DataFlowIteration,
    DataflowAnalysisResult,
    DebugStepData,
    DebugStepResponse,
    debugJson,
    loadProgram,
    proofHtml,
    run,
    runAnalysis,
    storeProgram,
    tc,
    transitionCfg
} from './wiz-commands';

export type WebviewMode = 'run' | 'debug' | 'tc' | 'proof' | 'analysis' | 'transition-cfg' | 'empty';

type TutorialExampleId = 'ex2' | 'ex3' | 'semantics';
type TutorialPlacement = 'top' | 'output';

type TutorialStep = {
    buttonId?: string,
    title: string,
    description: string,
    exampleId?: TutorialExampleId
};

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        buttonId: 'action-run',
        title: 'Run',
        description: 'Use Run to execute the program concretely and inspect its output. In semantic terms, this applies the operational rules from the initial configuration until a final configuration or the step bound is reached.'
    },
    {
        buttonId: 'action-debug',
        title: 'Debug',
        description: 'Open Debug to inspect execution one state at a time, including variables, memory, input, and output. This view exposes the small-step operational semantics and its intermediate configurations.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Debug: Next',
        description: 'Use Next to move to the semantic successor configuration. Each click follows one transition in the small-step execution relation.'
    },
    {
        buttonId: 'action-debug-prev',
        title: 'Debug: Prev',
        description: 'Use Prev to return to the previously displayed configuration. In the tutorial this lets you compare adjacent states in the operational semantics.'
    },
    {
        buttonId: 'action-tc',
        title: 'Type Check',
        description: 'Use Type Check to verify that expressions, variables, and statements are used consistently. Under the hood, it checks whether the program is derivable under the While* typing rules.'
    },
    {
        buttonId: 'action-proof',
        title: 'Proof',
        description: 'Open the Hoare proof view to inspect verification conditions for the specification. The proof engine computes weakest preconditions backward and checks the resulting obligations.'
    },
    {
        buttonId: 'tutorialNext',
        title: 'Switch Example',
        description: 'The tutorial now switches to a compact While example for the dataflow analyses. Click Next after the new program is open.',
        exampleId: 'ex3'
    },
    {
        buttonId: 'action-liveness',
        title: 'Liveness Analysis',
        description: 'Run Liveness to see which variable values still matter later in the program. Technically, this is a backward dataflow analysis that computes live-in and live-out sets to a fixpoint.'
    },
    {
        buttonId: 'action-analysis-next',
        title: 'Analysis: Next',
        description: 'Move forward through the intermediate iterations of the current analysis. You are stepping through the successive approximations produced during fixpoint computation.'
    },
    {
        buttonId: 'action-analysis-prev',
        title: 'Analysis: Prev',
        description: 'Move back through earlier approximation states of the current analysis. This makes the fixpoint iteration process visible instead of only showing the final result.'
    },
    {
        buttonId: 'action-reachability',
        title: 'Reachability Analysis',
        description: 'Run Reachability to identify which control-flow nodes can actually be entered. It works by propagating reachability facts forward from the entry node over the CFG.'
    },
    {
        buttonId: 'action-analysis-next',
        title: 'Reachability: Next',
        description: 'Move forward through the Reachability iteration steps. Each step shows how the set of reachable CFG nodes grows toward a fixpoint.'
    },
    {
        buttonId: 'action-analysis-prev',
        title: 'Reachability: Prev',
        description: 'Move back through the earlier Reachability approximations to compare how the CFG was explored.'
    },
    {
        buttonId: 'action-rd',
        title: 'Reaching Definitions',
        description: 'Inspect which assignments may define the current value of a variable at each program point. This is a forward dataflow analysis over gen, kill, in, and out sets.'
    },
    {
        buttonId: 'action-analysis-next',
        title: 'Reaching Definitions: Next',
        description: 'Move forward through the Reaching Definitions iterations. Each step refines the propagated definition sets toward the least fixpoint.'
    },
    {
        buttonId: 'action-analysis-prev',
        title: 'Reaching Definitions: Prev',
        description: 'Move back through earlier Reaching Definitions approximations to inspect how definitions accumulated.'
    },
    {
        buttonId: 'action-taint',
        title: 'Taint Analysis',
        description: 'Use Taint to inspect how marked information can propagate through assignments and control flow. The underlying analysis tracks taint facts through the CFG in an information-flow style.'
    },
    {
        buttonId: 'action-transition-cfg',
        title: 'Transition CFG',
        description: 'Finish with Transition CFG to inspect the control-flow structure used by the analyses. Here the program is represented as a graph of control points and possible transitions.'
    }
];

const SEMANTICS_TUTORIAL_STEPS: TutorialStep[] = [
    {
        buttonId: 'tutorialNext',
        title: 'Language Semantics',
        description: 'This tutorial explains what a While* program means when it runs. The key idea from the slides is that a program state is a configuration: the remaining program together with the current memory.'
    },
    {
        buttonId: 'tutorialNext',
        title: 'Syntax vs. Meaning',
        description: 'Syntax decides whether a program is well formed. Semantics gives that program a meaning by saying which evaluation and execution steps are allowed.'
    },
    {
        buttonId: 'tutorialNext',
        title: 'Variables and Memory',
        description: 'The vars block creates a variable map v and a memory m. The map v sends each variable name to an address, and m stores integer values at those addresses.'
    },
    {
        buttonId: 'action-debug',
        title: 'Open the Machine State',
        description: 'Click Debug to inspect the first configuration. The debugger shows the current statement, the remaining program, the variable map view, and the memory before and after the step.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Assignment',
        description: 'Step to the first assignment. For a statement a := e, the address expression a is resolved to an address and e is evaluated to a number; the next memory is m[address |-> value].'
    },
    {
        buttonId: 'action-debug-next',
        title: 'More Memory Updates',
        description: 'Step again. Assignments do not change the variable map v; they change the memory cell reached through v. That is why variable names remain stable while values change.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Address-Of',
        description: 'Now p := &x stores the address of x in the pointer variable p. The expression &x evaluates to the address v(x), not to the current value stored in x.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Dereference',
        description: 'The statement *p := 4 first reads p to obtain an address and then writes to the memory cell at that address. Since p contains &x, this update changes x indirectly.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Expression Evaluation',
        description: 'Now z := x + y evaluates a compound expression. Because the pointer update changed x, the arithmetic rule for + combines the new value of x with y.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Pointer Summary',
        description: 'Pointer semantics has two layers: address expressions resolve to memory addresses, while ordinary expression use reads the value stored at the resolved address.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Conditionals',
        description: 'The if statement evaluates its boolean condition. If the condition is true, execution continues with the then block; otherwise it continues with the else block.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Selected Branch',
        description: 'Step into the selected branch. The operational rule replaces the if statement by exactly the block whose guard result applies, followed by the remaining program.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Loop Test',
        description: 'The while statement also starts by evaluating a boolean condition. If it is false, the loop disappears and execution continues after the loop.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Loop Unrolling',
        description: 'When the while condition is true, the semantics unrolls the loop once: first execute the body, then put the same while statement back after the body.'
    },
    {
        buttonId: 'action-debug-next',
        title: 'Output',
        description: 'Print evaluates its argument expressions and appends the text to the output stream. It observes values but does not update the variable map or memory.'
    },
    {
        buttonId: 'action-debug-prev',
        title: 'Compare Configurations',
        description: 'Use Prev once to compare two neighboring configurations. This is useful for seeing exactly which part of the program or memory changed in one semantic step.'
    },
    {
        buttonId: 'action-run',
        title: 'Whole Execution',
        description: 'Run executes the same transition relation repeatedly until the program finishes or the step bound is reached. The final output is the accumulated effect of all those small steps.'
    },
    {
        buttonId: 'action-transition-cfg',
        title: 'Control Flow',
        description: 'The transition CFG summarizes the possible control moves of the program as a graph. The execution semantics follows one path through this graph, depending on the current memory.'
    }
];

export class WebviewManager implements vscode.Disposable {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private steps = 50;
    private inputs = '';
    private debugStep = 0;
    private currentDebugData: DebugStepResponse | undefined;
    private currentAnalysisData: DataflowAnalysisResult | undefined;
    private currentAnalysisCommand: AnalysisCommand | undefined;
    private currentAnalysisIteration = 0;
    private lastProgramDocumentUri: string | undefined;
    private lastProgramContent: string | undefined;

    private editorDecorations: vscode.TextEditorDecorationType[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.trackProgramBuffers();
        this.syncProgramFromEditor(vscode.window.activeTextEditor);
    }

    public async openWebview(): Promise<void> {
        if (this.panel && this.panel.visible) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'whileStarInterpreter',
            'While Star Interpreter',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.setupMessageHandling();
        this.setupPanelEvents();
        this.updateContent('empty', '');
        this.updateSettings();
    }

    private setupMessageHandling(): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'run':
                        await this.handleRunCommand();
                        break;
                    case 'store':
                        await this.handleStoreCommand();
                        break;
                    case 'load':
                        await this.handleLoadCommand();
                        break;
                    case 'debug':
                        this.debugStep = 0;
                        await this.handleDebugCommand(true);
                        break;
                    case 'tc':
                        await this.handleTcCommand();
                        break;
                    case 'proof':
                        await this.handleProofCommand();
                        break;
                    case 'liveness-analysis':
                    case 'reachability-analysis':
                    case 'rd-analysis':
                    case 'taint-analysis':
                        await this.handleAnalysisCommand(message.command as AnalysisCommand, true);
                        break;
                    case 'transition-cfg':
                        await this.handleTransitionCfgCommand();
                        break;
                    case 'updateSteps':
                        this.steps = parseInt(message.value, 10) || 50;
                        break;
                    case 'updateInputs':
                        this.inputs = message.value || '';
                        break;
                    case 'debugPrev':
                        if (this.currentDebugData?.hasPrevious) {
                            this.debugStep = Math.max(0, this.debugStep - 1);
                            await this.handleDebugCommand(false);
                        }
                        break;
                    case 'debugNext':
                        if (this.currentDebugData?.hasNext) {
                            this.debugStep += 1;
                            await this.handleDebugCommand(false);
                        }
                        break;
                    case 'analysisPrev':
                        if (this.currentAnalysisIteration > 0) {
                            this.currentAnalysisIteration -= 1;
                            this.renderCurrentAnalysis(false);
                        }
                        break;
                    case 'analysisNext':
                        if (this.currentAnalysisData && this.currentAnalysisIteration < this.currentAnalysisData.iteration.length - 1) {
                            this.currentAnalysisIteration += 1;
                            this.renderCurrentAnalysis(false);
                        }
                        break;
                    case 'tutorialOpenExample':
                        await this.openTutorialExample(message.exampleId);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private setupPanelEvents(): void {
        if (!this.panel) {
            return;
        }

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, undefined, this.context.subscriptions);
    }

    private async handleRunCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const content = this.getActiveEditorContent();
            const response = await run(content, this.steps, this.inputs);
            this.updateContent('run', this.wrapRunHtml(response));
        } catch (error) {
            this.updateContent('run', this.renderError(error));
        }
    }

    private async handleStoreCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const editor = this.getProgramEditor();
            const content = this.getActiveEditorContent();
            const cleanedContent = this.stripGeneratedStoreUrlComment(content);
            const url = (await storeProgram(cleanedContent, this.steps, this.inputs)).trim();
            await this.addStoreUrlComment(editor, url);
            this.updateContent('run', this.wrapStoreHtml(url));
        } catch (error) {
            this.updateContent('run', this.renderError(error));
        }
    }

    private async handleLoadCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const url = await vscode.window.showInputBox({
                title: 'Load WhileStar Program',
                prompt: 'Enter a Wiz program URL',
                placeHolder: 'https://wiz.cs.tu-dortmund.de/program/...',
                ignoreFocusOut: true,
                validateInput: value => this.validateProgramUrl(value)
            });

            if (!url) {
                return;
            }

            const content = await loadProgram(url.trim());
            await this.openLoadedProgram(url.trim(), content);
            this.updateContent('run', this.wrapLoadHtml(url.trim()));
        } catch (error) {
            this.updateContent('run', this.renderError(error));
        }
    }

    private async handleDebugCommand(animate = true): Promise<void> {
        this.clearEditorDecorations();

        try {
            const content = this.getActiveEditorContent();
            const response = await debugJson(content, this.steps, this.inputs, this.debugStep);

            this.currentDebugData = response;
            this.debugStep = response.stepIndex;

            this.highlightCurrentStatement(response.stepData);
            this.displayVariableValues(response.stepData);

            this.updateContent('debug', this.generateDebugHtml(response), animate);
        } catch (error) {
            this.updateContent('debug', this.renderError(error), animate);
        }
    }

    private async handleTcCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const content = this.getActiveEditorContent();
            const response = await tc(content, this.steps, this.inputs);
            this.updateContent('tc', response);
        } catch (error) {
            this.updateContent('tc', this.renderError(error));
        }
    }

    private async handleProofCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const content = this.getActiveEditorContent();
            const response = await proofHtml(content, this.steps, this.inputs);
            this.updateContent('proof', response);
        } catch (error) {
            this.updateContent('proof', this.renderError(error));
        }
    }

    private async handleAnalysisCommand(command: AnalysisCommand, animate = true): Promise<void> {
        this.clearEditorDecorations();
        try {
            const content = this.getActiveEditorContent();
            const response = await runAnalysis(command, content, this.steps, this.inputs);
            this.currentAnalysisCommand = command;
            this.currentAnalysisData = response;
            this.currentAnalysisIteration = 0;
            this.renderCurrentAnalysis(animate);
        } catch (error) {
            this.updateContent('analysis', this.renderError(error), animate);
        }
    }

    private async handleTransitionCfgCommand(): Promise<void> {
        this.clearEditorDecorations();
        try {
            const content = this.getActiveEditorContent();
            const response = await transitionCfg(content, this.steps, this.inputs);
            this.updateContent('transition-cfg', this.generateTransitionCfgHtml(response));
        } catch (error) {
            this.updateContent('transition-cfg', this.renderError(error));
        }
    }

    private renderCurrentAnalysis(animate = true): void {
        if (!this.currentAnalysisData) {
            this.updateContent('analysis', '<p>No analysis data available.</p>', animate);
            return;
        }

        this.updateContent(
            'analysis',
            this.generateAnalysisHtml(this.currentAnalysisData, this.currentAnalysisIteration, this.currentAnalysisCommand),
            animate
        );
    }

    private updateContent(mode: WebviewMode, output: string, animate = true): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            command: 'updateContent',
            mode,
            output,
            animate
        });
    }

    private updateSettings(): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            command: 'updateSettings',
            steps: this.steps,
            inputs: this.inputs
        });
    }

    private getActiveEditorContent(): string {
        const editor = this.getProgramEditor();
        if (editor) {
            this.syncProgramFromEditor(editor);
        }

        if (this.lastProgramContent !== undefined) {
            return this.stripGeneratedStoreUrlComment(this.lastProgramContent);
        }

        throw new Error('No WhileStar program buffer is available.');
    }

    private getWebviewContent(): string {
        const htmlPath = path.join(this.context.extensionPath, 'resources', 'webview.html');
        try {
            const mermaidScriptUri = this.panel
                ? this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'resources', 'mermaid.min.js')).toString()
                : '';

            return fs.readFileSync(htmlPath, 'utf8')
                .replace(/__MERMAID_SCRIPT_URI__/g, mermaidScriptUri);
        } catch (err) {
            console.error('Failed to load webview HTML at', htmlPath, err);
            return 'Error loading webview content';
        }
    }

    public async executeRun(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleRunCommand();
    }

    public async executeStore(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleStoreCommand();
    }

    public async executeLoad(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleLoadCommand();
    }

    public async executeDebug(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        this.debugStep = 0;
        await this.handleDebugCommand(true);
    }

    public async executeTc(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleTcCommand();
    }

    public async executeProof(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleProofCommand();
    }

    public async executeAnalysis(command: AnalysisCommand): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleAnalysisCommand(command, true);
    }

    public async executeTransitionCfg(): Promise<void> {
        if (!this.panel) {
            await this.openWebview();
        }
        await this.handleTransitionCfgCommand();
    }

    public startTutorial(): void {
        this.postTutorial(TUTORIAL_STEPS);
    }

    public startSemanticsTutorial(): void {
        this.postTutorial(SEMANTICS_TUTORIAL_STEPS, 'output');
    }

    private postTutorial(steps: TutorialStep[], placement: TutorialPlacement = 'top'): void {
        if (!this.panel) {
            return;
        }

        this.panel.webview.postMessage({
            command: 'startTutorial',
            steps,
            placement
        });
    }

    public async openTutorialExample(exampleId: TutorialExampleId): Promise<void> {
        const filenames: Record<TutorialExampleId, string> = {
            ex2: 'ex2.wstar',
            ex3: 'ex3.wstar',
            semantics: 'semantics.wstar'
        };
        const filename = filenames[exampleId];
        const tutorialPath = this.context.asAbsolutePath(path.join('resources', 'tutorials', filename));
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(tutorialPath));

        await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.One,
            preserveFocus: true
        });
    }

    public dispose(): void {
        this.clearEditorDecorations();
        if (this.panel) {
            this.panel.dispose();
        }
    }

    private highlightCurrentStatement(stepData: DebugStepData): void {
        const editor = this.getProgramEditor();

        if (!editor) {
            return;
        }

        this.clearEditorDecorations();

        const statementText = stepData.statement?.trim();
        if (!statementText || statementText === 'ERROR') {
            return;
        }

        const document = editor.document;
        const cleanStatement = this.cleanStatement(statementText);
        const matchedRanges = this.findStatementInCode(document, cleanStatement);

        if (matchedRanges.length > 0) {
            const decoration = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255, 193, 7, 0.3)',
                border: '2px solid rgba(255, 193, 7, 0.8)',
                borderRadius: '3px',
                isWholeLine: true
            });

            editor.setDecorations(decoration, matchedRanges);
            this.storeDecoration(decoration);
            editor.revealRange(matchedRanges[0], vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        }
    }

    private cleanStatement(statement: string): string {
        return statement
            .split('\n')[0]
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[()]/g, '')
            .replace(/;$/, '');
    }

    private normalizeForMatching(statement: string): string {
        return statement
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[()]/g, '')
            .replace(/;$/, '')
            .toLowerCase();
    }

    private findStatementInCode(document: vscode.TextDocument, targetStatement: string): vscode.Range[] {
        const ranges: vscode.Range[] = [];
        const lines = document.getText().split('\n');
        const normalizedTarget = this.normalizeForMatching(targetStatement);

        for (let i = 0; i < lines.length; i++) {
            const normalizedLine = this.normalizeForMatching(lines[i]);
            if (normalizedLine === normalizedTarget && normalizedLine.length > 0) {
                ranges.push(document.lineAt(i).range);
            }
        }

        if (ranges.length > 0) {
            return [ranges[0]];
        }

        if (targetStatement.includes('=') || targetStatement.includes(':=')) {
            const assignOp = targetStatement.includes(':=') ? ':=' : '=';
            const parts = targetStatement.split(assignOp);
            if (parts.length >= 2) {
                const leftSide = this.normalizeForMatching(parts[0]);
                const rightSide = this.normalizeForMatching(parts[1]);

                for (let i = 0; i < lines.length; i++) {
                    const normalizedLine = this.normalizeForMatching(lines[i]);
                    if (normalizedLine.includes(assignOp.replace(/[()]/g, '')) && normalizedLine.includes(leftSide)) {
                        if (rightSide.length > 2) {
                            const rightWords = rightSide.split(/[\s\-+*/]/);
                            const lineWords = normalizedLine.split(/[\s\-+*/]/);
                            const commonWords = rightWords.filter(word =>
                                word.length > 0 && lineWords.some(lineWord => lineWord.includes(word))
                            );

                            if (commonWords.length > 0) {
                                ranges.push(document.lineAt(i).range);
                            }
                        } else {
                            ranges.push(document.lineAt(i).range);
                        }
                    }
                }
            }
        }

        if (ranges.length > 0) {
            return [ranges[0]];
        }

        const keywords = ['if', 'while', 'print', 'extern', '{', '}'];
        const targetKeyword = keywords.find(kw => normalizedTarget.includes(kw));

        if (targetKeyword) {
            for (let i = 0; i < lines.length; i++) {
                const normalizedLine = this.normalizeForMatching(lines[i]);
                if (normalizedLine.includes(targetKeyword)) {
                    ranges.push(document.lineAt(i).range);
                    break;
                }
            }
        }

        return ranges;
    }

    private displayVariableValues(stepData: DebugStepData): void {
        const editor = this.getProgramEditor();

        if (!editor) {
            return;
        }

        stepData.vars.forEach(variable => {
            if (variable.value !== null && variable.value !== undefined) {
                const ranges = this.findVariableInCode(editor.document, variable.name);
                if (ranges.length > 0) {
                    const decoration = vscode.window.createTextEditorDecorationType({
                        after: {
                            contentText: ` = ${variable.value}`,
                            color: 'rgba(78, 98, 255, 0.88)',
                            fontStyle: 'italic',
                            margin: '0 0 0 10px'
                        }
                    });

                    editor.setDecorations(decoration, [ranges[0]]);
                    this.storeDecoration(decoration);
                }
            }
        });
    }

    private findVariableInCode(document: vscode.TextDocument, variableName: string): vscode.Range[] {
        const ranges: vscode.Range[] = [];
        const lines = document.getText().split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const regex = new RegExp(`\\b${variableName}\\b`, 'g');
            let match: RegExpExecArray | null;

            while ((match = regex.exec(line)) !== null) {
                const startPos = new vscode.Position(i, match.index);
                const endPos = new vscode.Position(i, match.index + variableName.length);
                ranges.push(new vscode.Range(startPos, endPos));
            }
        }

        return ranges;
    }

    private generateDebugHtml(response: DebugStepResponse): string {
        const stepData = response.stepData;

        return `
        <div class="debug">
            <div class="toolbar">
                <button id="action-debug-prev" class="action" onclick="debugPrev()" ${response.hasPrevious ? '' : 'disabled'}>Prev</button>
                <span>Step ${response.currentStep} of ${response.totalSteps}</span>
                <button id="action-debug-next" class="action" onclick="debugNext()" ${response.hasNext ? '' : 'disabled'}>Next</button>
            </div>
            <div class="debug-step" data-step="${response.currentStep}">
                <div class="configuration">
                    <h6>Current Statement (S)</h6>
                    <pre><code>${this.escapeHtml(stepData.statement)}</code></pre>
                    <h6>Remainder (P)</h6>
                    <pre><code>${this.escapeHtml(stepData.remainder)}</code></pre>
                    <h6>After (R)</h6>
                    <pre><code>${this.escapeHtml(stepData.sPrime)}</code></pre>
                </div>

                <div class="scope">
                    <h6>Scope (v)</h6>
                    <table><thead><tr><th>Var.</th><th>Addr.</th><th>Value</th></tr></thead><tbody>
                    ${stepData.vars.map(variable =>
            `<tr><td class="${variable.isHighlighted ? 'highlighted' : ''}">${this.escapeHtml(variable.name)}</td><td class="${variable.isHighlighted ? 'highlighted' : ''}">${this.escapeHtml(variable.address)}</td><td>${this.escapeHtml(variable.value ?? '-')}</td></tr>`
        ).join('')}
                    </tbody></table>
                    <h6>Input</h6><pre>${this.escapeHtml(stepData.input)}</pre>
                    <h6>Output</h6><pre>${this.escapeHtml(stepData.output)}</pre>
                </div>

                <div class="memory">
                    <h6>Memory (m)</h6>
                    <table><thead><tr><th>Addr.</th><th>Before</th><th>After</th></tr></thead><tbody>
                    ${stepData.memory.map(cell =>
            `<tr><td>${this.escapeHtml(cell.address)}</td><td class="${cell.isRead ? 'read-highlight' : ''}">${this.escapeHtml(cell.before)}</td><td class="${cell.isWritten ? 'write-highlight' : ''}">${this.escapeHtml(cell.after)}</td></tr>`
        ).join('')}
                    </tbody></table>
                </div>

                <div class="proof">
                    <h6>S.O.S. Proof</h6>
                    <div class="proof-content">${stepData.sosProof}</div>
                </div>
            </div>
        </div>`;
    }

    private generateAnalysisHtml(
        result: DataflowAnalysisResult,
        iterationIndex: number,
        command: AnalysisCommand | undefined
    ): string {
        if (result.iteration.length === 0) {
            return `<div class="analysis"><h4>${this.escapeHtml(result.caption)}</h4><p>No analysis result available.</p></div>`;
        }

        const iteration = result.iteration[iterationIndex];
        const title = command ? this.analysisTitle(command) : result.caption;

        return `
        <div class="analysis">
            <h4>${this.escapeHtml(title)}</h4>
            <div class="analysis-summary">
                <strong>Active analysis</strong>
                <span>${this.escapeHtml(title)}</span>
            </div>
            <div class="toolbar">
                <button id="action-analysis-prev" class="action" onclick="analysisPrev()" ${iterationIndex > 0 ? '' : 'disabled'}>Prev</button>
                <span>Iteration ${iteration.iterationNumber + 1} of ${result.iteration.length}</span>
                <button id="action-analysis-next" class="action" onclick="analysisNext()" ${iterationIndex < result.iteration.length - 1 ? '' : 'disabled'}>Next</button>
            </div>
            ${result.checkResult ? `<p><strong>Check result:</strong> ${this.escapeHtml(result.checkResult)}</p>` : ''}
            <div class="analysis-grid">
                <div>
                    <h6>Control-Flow Graph (Mermaid)</h6>
                    ${this.renderMermaidBlock(iteration.cfg, 'Control-flow graph source', `analysis:${title}`)}
                </div>
                <div>
                    <h6>Facts</h6>
                    ${this.renderAnalysisTable(result, iteration)}
                </div>
            </div>
        </div>`;
    }

    private renderAnalysisTable(result: DataflowAnalysisResult, iteration: DataFlowIteration): string {
        const headers = [
            'Statement',
            result.genSetCaption,
            result.killSetCaption,
            result.inSetCaption,
            result.outSetCaption
        ].filter((value): value is string => Boolean(value));

        const rows = iteration.tableRows.map(row => {
            const cells = [
                this.escapeHtml(row.statement),
                result.genSetCaption ? this.escapeHtml(row.genSet ?? '-') : null,
                result.killSetCaption ? this.escapeHtml(row.killSet ?? '-') : null,
                result.inSetCaption ? this.escapeHtml(row.inSet ?? '-') : null,
                result.outSetCaption ? this.escapeHtml(row.outSet ?? '-') : null
            ].filter((value): value is string => value !== null);

            return `<tr id="dfRow-${row.nodeId}">${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
        }).join('');

        return `
        <table>
            <thead>
                <tr>${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    private generateTransitionCfgHtml(cfg: string): string {
        return `
        <div class="transition-cfg">
            <h4>Transition CFG</h4>
            ${this.renderMermaidBlock(cfg, 'Transition CFG source', 'transition-cfg')}
        </div>`;
    }

    private renderMermaidBlock(diagram: string, sourceLabel: string, graphKey: string): string {
        return `
        <div class="mermaid-wrapper" data-graph-key="${this.escapeHtml(graphKey)}">
            <div class="mermaid-actions">
                <button class="action" onclick="zoomGraph(this, 1.2)">Zoom in</button>
                <button class="action" onclick="zoomGraph(this, 1 / 1.2)">Zoom out</button>
                <button class="action" onclick="resetGraphView(this)">Reset view</button>
            </div>
            <div class="graph-viewport">
                <div class="graph-stage">
                    <pre class="mermaid">${this.escapeHtml(diagram)}</pre>
                </div>
            </div>
            <details class="mermaid-source">
                <summary>${this.escapeHtml(sourceLabel)}</summary>
                <pre><code>${this.escapeHtml(diagram)}</code></pre>
            </details>
        </div>`;
    }

    private wrapRunHtml(output: string): string {
        return `
        <div class="run">
            <h4>Run Output</h4>
            <pre>${this.escapeHtml(output)}</pre>
        </div>`;
    }

    private wrapStoreHtml(url: string): string {
        return `
        <div class="run">
            <h4>Program Stored</h4>
            <p>The stored program URL was added to the editor as a comment.</p>
            <pre>${this.escapeHtml(url)}</pre>
        </div>`;
    }

    private wrapLoadHtml(url: string): string {
        return `
        <div class="run">
            <h4>Program Loaded</h4>
            <p>The program was opened as a new unsaved While* document.</p>
            <pre>${this.escapeHtml(url)}</pre>
        </div>`;
    }

    private renderError(error: unknown): string {
        const message = error instanceof Error ? error.message : String(error);
        return `<div class="error"><strong>Error:</strong> ${this.escapeHtml(message)}</div>`;
    }

    private analysisTitle(command: AnalysisCommand): string {
        switch (command) {
            case 'liveness-analysis':
                return 'Liveness Analysis';
            case 'reachability-analysis':
                return 'Reachability Analysis';
            case 'rd-analysis':
                return 'Reaching Definitions';
            case 'taint-analysis':
                return 'Taint Analysis';
        }
    }

    private escapeHtml(unsafe: string | null | undefined): string {
        if (unsafe === null || unsafe === undefined) {
            return '';
        }
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private clearEditorDecorations(): void {
        this.editorDecorations.forEach(decoration => decoration.dispose());
        this.editorDecorations = [];
    }

    private storeDecoration(decoration: vscode.TextEditorDecorationType): void {
        this.editorDecorations.push(decoration);
    }

    private trackProgramBuffers(): void {
        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.syncProgramFromEditor(editor);
            }),
            vscode.workspace.onDidOpenTextDocument(document => {
                this.syncProgramFromDocument(document);
            }),
            vscode.workspace.onDidChangeTextDocument(event => {
                this.syncProgramFromDocument(event.document);
            })
        );
    }

    private syncProgramFromEditor(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            return;
        }

        this.syncProgramFromDocument(editor.document);
    }

    private syncProgramFromDocument(document: vscode.TextDocument): void {
        if (!this.isWhileStarDocument(document)) {
            return;
        }

        this.lastProgramDocumentUri = document.uri.toString();
        this.lastProgramContent = document.getText();
    }

    private getProgramEditor(): vscode.TextEditor | undefined {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && this.isWhileStarEditor(activeEditor)) {
            return activeEditor;
        }

        const visibleWhileStarEditors = vscode.window.visibleTextEditors.filter(editor => this.isWhileStarEditor(editor));
        if (this.lastProgramDocumentUri) {
            const previousEditor = visibleWhileStarEditors.find(
                editor => editor.document.uri.toString() === this.lastProgramDocumentUri
            );
            if (previousEditor) {
                return previousEditor;
            }
        }

        if (this.lastProgramDocumentUri) {
            const openDocument = vscode.workspace.textDocuments.find(
                document => document.uri.toString() === this.lastProgramDocumentUri
            );
            if (openDocument) {
                this.syncProgramFromDocument(openDocument);
            }
        }

        return visibleWhileStarEditors[0];
    }

    private async addStoreUrlComment(editor: vscode.TextEditor | undefined, url: string): Promise<void> {
        const document = editor?.document ?? this.getLastProgramDocument();
        if (!document) {
            throw new Error('No WhileStar editor is available to update with the stored program URL.');
        }

        const existingText = document.getText();
        const textWithoutGeneratedComment = this.stripGeneratedStoreUrlComment(existingText);
        const updatedText = `// Wiz URL: ${url}\n${textWithoutGeneratedComment.replace(/^\s*\n/, '')}`;
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(existingText.length)
        );

        const applied = editor
            ? await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, updatedText);
            })
            : await this.applyDocumentReplacement(document, fullRange, updatedText);

        if (!applied) {
            throw new Error('Could not add the stored program URL to the editor.');
        }

        this.lastProgramDocumentUri = document.uri.toString();
        this.lastProgramContent = updatedText;
    }

    private async openLoadedProgram(url: string, content: string): Promise<void> {
        const cleanedContent = this.stripGeneratedStoreUrlComment(content);
        const documentContent = `// Wiz URL: ${url}\n${cleanedContent.replace(/^\s*\n/, '')}`;
        const document = await vscode.workspace.openTextDocument({
            language: 'while-star',
            content: documentContent
        });

        await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.One
        });

        this.lastProgramDocumentUri = document.uri.toString();
        this.lastProgramContent = documentContent;
    }

    private stripGeneratedStoreUrlComment(content: string): string {
        return content.replace(/^\/\/\s*Wiz URL:\s*https?:\/\/[^\r\n]*(?:\r?\n)?/u, '');
    }

    private validateProgramUrl(value: string): string | undefined {
        const trimmed = value.trim();
        if (!trimmed) {
            return 'Enter a Wiz program URL.';
        }

        try {
            const url = new URL(trimmed);
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return 'Use an http or https URL.';
            }
            if (!url.pathname.includes('/program/')) {
                return 'The URL must contain /program/.';
            }
        } catch {
            return 'Enter a valid URL.';
        }

        return undefined;
    }

    private getLastProgramDocument(): vscode.TextDocument | undefined {
        if (!this.lastProgramDocumentUri) {
            return undefined;
        }

        return vscode.workspace.textDocuments.find(
            document => document.uri.toString() === this.lastProgramDocumentUri
        );
    }

    private async applyDocumentReplacement(
        document: vscode.TextDocument,
        fullRange: vscode.Range,
        updatedText: string
    ): Promise<boolean> {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, fullRange, updatedText);
        return vscode.workspace.applyEdit(edit);
    }

    private isWhileStarEditor(editor: vscode.TextEditor): boolean {
        return this.isWhileStarDocument(editor.document);
    }

    private isWhileStarDocument(document: vscode.TextDocument): boolean {
        return document.languageId === 'while-star' || document.fileName.endsWith('.wstar');
    }
}
