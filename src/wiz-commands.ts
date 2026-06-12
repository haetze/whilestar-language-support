import { normalizeStoredProgramUrl } from './storedProgramUrl';

declare const __WIZ_BASE_URL__: string;

let wizBaseUrl = `${__WIZ_BASE_URL__.replace(/\/$/, '')}/raw`;

export function setWizBaseUrl(baseUrl: string): void {
    wizBaseUrl = `${baseUrl.replace(/\/$/, '')}/raw`;
}

export interface DebugStepResponse {
    stepIndex: number;
    currentStep: number;
    totalSteps: number;
    hasNext: boolean;
    hasPrevious: boolean;
    stepData: DebugStepData;
}

export interface DebugStepData {
    vars: VariableInfo[];
    memory: MemoryCell[];
    statement: string;
    remainder: string;
    sPrime: string;
    input: string;
    output: string;
    sosProof: string;
    statementLocation?: StatementLocation;
}

export interface VariableInfo {
    name: string;
    address: string;
    value?: string;
    isHighlighted: boolean;
}

export interface MemoryCell {
    address: string;
    before: string;
    after: string;
    isRead: boolean;
    isWritten: boolean;
}

export interface StatementLocation {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface DataflowAnalysisResult {
    iteration: DataFlowIteration[];
    checkResult: string | null;
    genSetCaption: string | null;
    killSetCaption: string | null;
    inSetCaption: string | null;
    outSetCaption: string | null;
    caption: string;
    totalIterations: number;
}

export interface DataFlowIteration {
    cfg: string;
    iterationNumber: number;
    tableRows: DataflowRow[];
}

export interface DataflowRow {
    nodeId: number;
    statement: string;
    genSet: string | null;
    killSet: string | null;
    inSet: string | null;
    outSet: string | null;
}

export type AnalysisCommand = 'liveness-analysis' | 'reachability-analysis' | 'rd-analysis' | 'taint-analysis';

function createBody(code: string, steps: number, inputs: string): string {
    const params = new URLSearchParams();
    params.set('code', code);
    params.set('steps', String(steps));
    params.set('inputs', inputs);
    return params.toString();
}

function createUrlBody(url: string): string {
    const params = new URLSearchParams();
    params.set('url', url);
    return params.toString();
}

async function readError(response: Response): Promise<string> {
    const body = await response.text();
    return body.trim() || `${response.status} ${response.statusText}`;
}

async function requestText(endpoint: string, code: string, steps: number, inputs: string): Promise<string> {
    const response = await fetch(`${wizBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: createBody(code, steps, inputs)
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.text();
}

async function requestJson<T>(endpoint: string, code: string, steps: number, inputs: string): Promise<T> {
    const response = await fetch(`${wizBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: createBody(code, steps, inputs)
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.json() as Promise<T>;
}

async function requestProgramUrl(endpoint: string, url: string): Promise<string> {
    const response = await fetch(`${wizBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: createUrlBody(url)
    });

    if (!response.ok) {
        throw new Error(await readError(response));
    }

    return response.text();
}

export function run(code: string, steps = 50, inputs = ''): Promise<string> {
    return requestText('/run', code, steps, inputs);
}

export async function storeProgram(code: string, steps = 50, inputs = ''): Promise<string> {
    const url = await requestText('/store', code, steps, inputs);
    return normalizeStoredProgramUrl(url);
}

export function loadProgram(url: string): Promise<string> {
    return requestProgramUrl('/load', url);
}

export function debugJson(code: string, steps = 50, inputs = '', step = 0): Promise<DebugStepResponse> {
    return requestJson<DebugStepResponse>(`/debug-json/${step}`, code, steps, inputs);
}

export function tc(code: string, steps = 50, inputs = ''): Promise<string> {
    return requestText('/tc', code, steps, inputs);
}

export function proofHtml(code: string, steps = 50, inputs = ''): Promise<string> {
    return requestText('/proof-html', code, steps, inputs);
}

export function runAnalysis(command: AnalysisCommand, code: string, steps = 50, inputs = ''): Promise<DataflowAnalysisResult> {
    return requestJson<DataflowAnalysisResult>(`/${command}`, code, steps, inputs);
}

export function transitionCfg(code: string, steps = 50, inputs = ''): Promise<string> {
    return requestText('/transition-cfg', code, steps, inputs);
}
