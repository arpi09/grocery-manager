// Lint only the files changed vs origin/master (plus working-tree + staged +
// untracked changes). Keeps the local G0 loop (`quick:dev`) fast — full-tree
// `eslint .` is type-aware (projectService) and takes minutes across the repo.
//
// This is an ITERATION optimization only: CI `pr-gate` still runs the
// authoritative full `npm run lint`, so nothing can slip through by being
// unchanged locally. Exits 0 quietly when nothing lintable changed.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function git(args) {
	try {
		return execFileSync('git', args, { encoding: 'utf8' });
	} catch {
		return '';
	}
}

const LINTABLE = /\.(m?js|cjs|ts|svelte)$/;
const base = git(['merge-base', 'origin/master', 'HEAD']).trim();

const sources = [
	base ? git(['diff', '--name-only', base, 'HEAD']) : '',
	git(['diff', '--name-only']), // unstaged
	git(['diff', '--name-only', '--cached']), // staged
	git(['ls-files', '--others', '--exclude-standard']) // untracked
];

const files = [...new Set(sources.join('\n').split('\n').map((f) => f.trim()).filter(Boolean))].filter(
	(f) => LINTABLE.test(f) && existsSync(f)
);

if (files.length === 0) {
	console.log('lint-changed: no changed JS/TS/Svelte files — skipping.');
	process.exit(0);
}

console.log(`lint-changed: linting ${files.length} changed file(s)…`);
try {
	execFileSync(
		process.execPath,
		[
			'node_modules/eslint/bin/eslint.js',
			'--no-warn-ignored',
			'--cache',
			'--cache-location',
			'.eslintcache',
			...files
		],
		{ stdio: 'inherit' }
	);
} catch {
	process.exit(1);
}
