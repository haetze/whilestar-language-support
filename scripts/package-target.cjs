const path = require('node:path');
const { spawnSync } = require('node:child_process');

const validTargets = new Set(['developing', 'publishing']);
const target = process.argv[2] || 'publishing';

if (!validTargets.has(target)) {
    console.error(`Unsupported package target: ${target}`);
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

run(process.execPath, [path.join(__dirname, 'build-target.cjs'), target]);
run('./node_modules/.bin/eslint', ['src']);
run('npm', ['exec', '--yes', '@vscode/vsce', '--', 'package', '--out', `whilestar-language-support-${target}.vsix`]);
