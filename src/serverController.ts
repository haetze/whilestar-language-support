
import { ChildProcess, spawn } from "child_process";
import type { ServerType } from "./extension";

let springBootProcess: ChildProcess | null = null;
const DEFAULT_SERVER_PORT = 18080;

const JAR_FILE = 'wiz-0.0.1-SNAPSHOT.jar';
const BINARY_FILE = 'wiz';

export function startServer(currentDir: string, serverType: ServerType, serverPort: number = DEFAULT_SERVER_PORT) {

    const JAR_PATH = currentDir + '/' + JAR_FILE; // Ensure the path is correct
    const BINARY_PATH = currentDir + '/' + BINARY_FILE; // Ensure the path is correct
    const serverArgs = [`--server.port=${serverPort}`];

    if (springBootProcess) {
        console.log('Server is already running');
        return;
    }

    if (serverType === 'binary') {
        springBootProcess = spawn(BINARY_PATH, serverArgs);
    } else if (serverType === 'jar') {
        springBootProcess = spawn('java', ['-jar', JAR_PATH, ...serverArgs]);
    }


    if (!springBootProcess) {
        console.error('Failed to start Spring Boot server');
        return;
    }

    // Log stdout output
    springBootProcess.stdout?.on('data', (data) => {
        console.log(`[Spring Boot] ${data.toString()}`);
    });

    // Log stderr output
    springBootProcess.stderr?.on('data', (data) => {
        console.error(`[Spring Boot Error] ${data.toString()}`);
    });

    springBootProcess?.on('exit', (code) => {
        console.log(`Spring Boot server exited with code ${code}`);
        springBootProcess = null;
    });

    console.log('Spring Boot server started with PID:', springBootProcess.pid);
}

export function getServerBaseUrl(serverPort: number = DEFAULT_SERVER_PORT): string {
    return `http://127.0.0.1:${serverPort}`;
}

export function stopServer() {
    if (!springBootProcess) {
        console.log('No server is running');
        return;
    }

    springBootProcess.kill('SIGTERM'); // or 'SIGINT'
    console.log('Spring Boot server stopped');
}
