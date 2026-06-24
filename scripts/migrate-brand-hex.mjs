/**
 * One-shot codemod: replace common hardcoded hex with CSS custom properties.
 * Run: node scripts/migrate-brand-hex.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKIP = new Set([
	'src/lib/design/brand-colors.ts',
	'src/lib/design/brand-colors.generated.css',
	'src/theme/brand-variables.generated.scss',
	'src/theme/dark/brand-variables.generated.scss',
	'static/smui.css',
	'static/smui-dark.css'
]);

const REPLACEMENTS = [
	[/var\(--color-([a-z-]+),\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--color-$1)'],
	[/var\(--color-on-primary,\s*#fff\)/g, 'var(--color-on-primary)'],
	[/var\(--color-on-primary,\s*#ffffff\)/gi, 'var(--color-on-primary)'],
	[/var\(--color-warning,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--color-warning)'],
	[/var\(--color-danger,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--color-danger)'],
	[/--lista-brand:\s*#2c4a3e/g, '--lista-brand: var(--color-primary)'],
	[/--lista-accent:\s*#d4a853/g, '--lista-accent: var(--color-accent)'],
	[/color:\s*#fff\b/g, 'color: var(--color-on-primary)'],
	[/color:\s*#ffffff\b/gi, 'color: var(--color-on-primary)'],
	[/fill="#2c4a3e"/g, 'fill="var(--color-primary)"'],
	[/fill="#ffffff"/g, 'fill="var(--color-on-primary)"'],
	[/fill="#d4a853"/g, 'fill="var(--color-accent)"'],
	[/stroke="#e8f0ea"/g, 'stroke="color-mix(in srgb, var(--color-on-primary) 90%, var(--color-primary))"'],
	[/color-mix\([^)]*,\s*#000\)/g, (m) => m.replace('#000', 'var(--color-text)')],
	[/color-mix\([^)]*,\s*#fff\)/gi, (m) => m.replace(/#fff(fff)?/i, 'var(--color-on-primary)')],
	[/#2c4a3e/g, 'var(--color-primary)'],
	[/#243d32/g, 'var(--color-primary-hover)'],
	[/#4d8f68/g, 'var(--color-primary)'],
	[/#5aa076/g, 'var(--color-primary-hover)'],
	[/#d4a853/g, 'var(--color-accent)'],
	[/#f7f5f0/g, 'var(--color-bg)'],
	[/#ffffff/g, 'var(--color-surface)'],
	[/#eef2eb/g, 'var(--color-surface-muted)'],
	[/#dde5d8/g, 'var(--color-border)'],
	[/#1f2a24/g, 'var(--color-text)'],
	[/#4a5850/g, 'var(--color-text-muted)'],
	[/#141a17/g, 'var(--color-bg)'],
	[/#1e2820/g, 'var(--color-surface)'],
	[/#243028/g, 'var(--color-surface-muted)'],
	[/#2a3d30/g, 'var(--color-border)'],
	[/#a0b0a8/g, 'var(--color-text)'],
	[/#8fa399/g, 'var(--color-text-muted)'],
	[/#b54a4a/g, 'var(--color-danger)'],
	[/#e07a7a/g, 'var(--color-danger)'],
	[/#2d6a4f/g, 'var(--color-success)'],
	[/#3d8f5c/g, 'var(--color-success)'],
	[/#5cb88a/g, 'var(--color-success)'],
	[/#6ecf96/g, 'var(--color-success)'],
	[/#9a6700/g, 'var(--color-warning)'],
	[/#c9870a/g, 'var(--color-warning)'],
	[/#e8a317/g, 'var(--color-warning)'],
	[/#f0b429/g, 'var(--color-warning)'],
	[/#b45309/g, 'var(--color-warning)'],
	[/#3d6b8c/g, 'var(--color-info)'],
	[/#4a8fb8/g, 'var(--color-info)'],
	[/#6eb0d4/g, 'var(--color-info)'],
	[/#7ec4e8/g, 'var(--color-info)'],
	[/#6b4c9a/g, 'var(--color-learning-ai)'],
	[/#4A62A8/gi, 'var(--color-learning-ai)'],
	[/#c4b8a8/g, 'var(--color-taupe)'],
	[/#8a9a7b/g, 'var(--color-secondary)'],
	[/#6b7280/g, 'var(--color-text-muted)'],
	[/#475569/g, 'var(--color-secondary)'],
	[/#1d4ed8/g, 'var(--color-info)'],
	[/#0f766e/g, 'var(--color-info)'],
	[/#8a1f1f/g, 'var(--color-danger)'],
	[/#3d1515/g, 'var(--color-danger)'],
	[/#6b4a12/g, 'var(--color-warning)'],
	[/#8a5a12/g, 'var(--color-warning)'],
	[/#c0392b/g, 'var(--color-danger)'],
	[/#b42318/g, 'var(--color-danger)'],
	[/#8a857e/g, 'var(--color-text-muted)'],
	[/#d4cfc4/g, 'var(--color-taupe)'],
	[/#edeae4/g, 'var(--color-surface-muted)'],
	[/#e8e4dc/g, 'var(--color-surface-muted)'],
	[/#c8c0b0/g, 'var(--color-taupe)'],
	[/#6b7d62/g, 'var(--color-secondary)'],
	[/#5a6b52/g, 'var(--color-secondary)'],
	[/#8a7d6e/g, 'var(--color-secondary)'],
	[/#e8f0ea/g, 'var(--color-surface-muted)'],
	[/#4a5a44/g, 'var(--color-secondary)'],
	[/#726758/g, 'var(--color-text-muted)'],
	[/#a09488/g, 'var(--color-taupe)'],
	[/#94a58c/g, 'var(--color-secondary)'],
	[/#b8b2a8/g, 'var(--color-taupe)'],
	[/#8a8580/g, 'var(--color-text-muted)'],
	[/#a09a94/g, 'var(--color-taupe)'],
	[/#b0bea8/g, 'var(--color-secondary)']
];

function collectFiles(dir, files = []) {
	if (!existsSync(dir)) return files;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (['node_modules', '.svelte-kit', 'build'].includes(entry.name)) continue;
			collectFiles(path, files);
		} else if (/\.(svelte|css|scss|ts|svg)$/.test(entry.name)) {
			files.push(path);
		}
	}
	return files;
}

let changed = 0;

for (const file of [...collectFiles(join(root, 'src')), ...collectFiles(join(root, 'static'))]) {
	const rel = relative(root, file).replace(/\\/g, '/');
	if (SKIP.has(rel) || rel.includes('.test.')) continue;

	let text = readFileSync(file, 'utf8');
	const before = text;

	for (const [pattern, replacement] of REPLACEMENTS) {
		text = text.replace(pattern, replacement);
	}

	if (text !== before) {
		writeFileSync(file, text, 'utf8');
		changed++;
		console.log(`Updated ${rel}`);
	}
}

console.log(`Migration complete — ${changed} file(s) updated.`);
