const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const validTargets = new Set(['developing', 'publishing']);
const target = process.argv[2] || process.env.WIZ_BUILD_TARGET || 'publishing';

if (!validTargets.has(target)) {
    console.error(`Unsupported build target: ${target}`);
    process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const env = {
    ...process.env,
    WIZ_BUILD_TARGET: target
};

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: rootDir,
        stdio: 'inherit',
        env
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function esbuildBaseArgs(selectedTarget) {
    const baseUrl = selectedTarget === 'developing'
        ? 'http://127.0.0.1:8080'
        : 'https://wiz.cs.tu-dortmund.de';

    return [
        './src/extension.ts',
        '--bundle',
        '--outfile=out/extension.js',
        '--external:vscode',
        '--format=cjs',
        '--platform=node',
        `--define:__WIZ_BASE_URL__=${JSON.stringify(baseUrl)}`,
        `--define:__WIZ_SERVER_LOCATION__=${JSON.stringify('remote')}`,
        `--define:__WIZ_SERVER_TYPE__=${JSON.stringify('binary')}`,
        `--define:__WIZ_SERVER_PORT__=${JSON.stringify(8080)}`
    ];
}

fs.copyFileSync(
    path.join(rootDir, 'src', 'resources', 'webview.html'),
    path.join(rootDir, 'resources', 'webview.html')
);

run('./node_modules/.bin/langium', ['generate']);
run('./node_modules/.bin/esbuild', esbuildBaseArgs(target));
run('./node_modules/.bin/esbuild', [
    './src/language-server/main.ts',
    '--bundle',
    '--outfile=out/language-server/main.js',
    '--external:vscode',
    '--format=cjs',
    '--platform=node'
]);
