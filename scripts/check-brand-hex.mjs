/**
 * Fail if hex colors appear outside brand-colors.ts and generated brand artifacts.
 * Run: node scripts/check-brand-hex.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

const ALLOWED_FILES = new Set([
	'src/lib/design/brand-colors.ts',
	'src/lib/design/brand-colors.generated.css',
	'src/lib/design/brand-tokens.generated.css',
	'src/theme/brand-variables.generated.scss',
	'src/theme/dark/brand-variables.generated.scss',
	'local/brand-palette-preview.html',
	'src/app.html',
	'src/lib/components/molecules/GoogleSignInButton.svelte',
	'static/favicon.svg',
	'static/smui.css',
	'static/smui-dark.css'
]);

const ALLOWED_PREFIXES = [
	'static/pwa/',
	'scripts/social-',
	'src/lib/design/brand/',
	'scripts/generate-brand-',
	'scripts/generate-pwa-icons.mjs',
	'scripts/generate-store-icons.mjs',
	'scripts/skaffu-mark.mjs',
	'scripts/migrate-brand-hex.mjs',
	'scripts/brand-tokens.generated.mjs',
	'scripts/releases-append-row.mjs'
];

const SCAN_EXTENSIONS = /\.(svelte|css|scss|ts|js|mjs|html|svg)$/;

function isAllowed(relPath) {
	const normalized = relPath.replace(/\\/g, '/');
	if (ALLOWED_FILES.has(normalized)) return true;
	if (ALLOWED_PREFIXES.some((p) => normalized.startsWith(p) || normalized.endsWith(p))) return true;
	if (normalized.includes('.test.') || normalized.includes('.integration.test.')) return true;
	if (normalized.endsWith('.generated.css') || normalized.endsWith('.generated.scss')) return true;
	return false;
}

function collectFiles(dir, files = []) {
	if (!existsSync(dir)) return files;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (['node_modules', '.svelte-kit', 'build', 'local'].includes(entry.name)) continue;
			collectFiles(path, files);
		} else if (entry.isFile() && SCAN_EXTENSIONS.test(entry.name)) {
			files.push(path);
		}
	}
	return files;
}

const errors = [];

for (const scanRoot of ['src', 'scripts', 'static', 'e2e']) {
	const absRoot = join(root, scanRoot);
	for (const file of collectFiles(absRoot)) {
		const rel = relative(root, file).replace(/\\/g, '/');
		if (isAllowed(rel)) continue;

		const text = readFileSync(file, 'utf8');
		const matches = [...text.matchAll(HEX_RE)];
		if (matches.length === 0) continue;

		const unique = [...new Set(matches.map((m) => m[0]))];
		errors.push(`${rel}: ${unique.length} hex value(s) — ${unique.slice(0, 5).join(', ')}${unique.length > 5 ? '…' : ''}`);
	}
}

if (errors.length > 0) {
	console.error('Brand hex check failed — hex must only live in brand-colors.ts (+ generated files):\n');
	for (const err of errors) console.error(`  ${err}`);
	process.exit(1);
}

console.log('Brand hex check passed.');
