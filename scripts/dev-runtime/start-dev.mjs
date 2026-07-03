#!/usr/bin/env node
/**
 * Cross-platform dev:start — PowerShell on Windows, bash elsewhere.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..', '..');
const worktreeArg = process.argv.find((a) => a === '-Worktree' || a.startsWith('-Worktree='));
let worktree = 'ai';
if (worktreeArg === '-Worktree') {
	worktree = process.argv[process.argv.indexOf('-Worktree') + 1] ?? 'ai';
} else if (worktreeArg?.startsWith('-Worktree=')) {
	worktree = worktreeArg.split('=')[1] ?? 'ai';
}

if (process.platform === 'win32') {
	const ps1 = join(scriptDir, 'start-dev.ps1');
	const child = spawn(
		'powershell',
		['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-Worktree', worktree],
		{ stdio: 'inherit', cwd: repoRoot }
	);
	child.on('exit', (code) => process.exit(code ?? 1));
} else {
	const sh = join(scriptDir, 'start-dev.sh');
	const child = spawn('bash', [sh], { stdio: 'inherit', cwd: repoRoot, env: process.env });
	child.on('exit', (code) => process.exit(code ?? 1));
}
