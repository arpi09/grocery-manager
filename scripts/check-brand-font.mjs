/**
 * Fail if brand font family or Google Fonts URLs appear outside allowed brand files.
 * Run: node scripts/check-brand-font.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const FONT_RE = /DM Sans|fonts\.googleapis\.com/g;

const ALLOWED_FILES = new Set([
	'src/lib/design/brand/typography.ts',
	'src/lib/design/brand-tokens.generated.css',
	'src/app.html',
	'scripts/social-fonts.mjs',
	'scripts/brand-tokens.generated.mjs',
	'scripts/generate-brand-css.mts',
	'scripts/check-brand-font.mjs',
	'scripts/generate-og-image.mjs',
	'src/lib/server/security-headers.ts',
	'static/smui.css',
	'static/smui-dark.css',
	'docs/design/consumer-ux-v2/screens/_tokens.css'
]);

const ALLOWED_PREFIXES = [
	'scripts/social-',
	'scripts/generate-brand-',
	'scripts/design-kit/',
	'local/brand-palette-preview.html'
];

const SCAN_EXTENSIONS = /\.(svelte|css|scss|ts|js|mjs|html)$/;

function isAllowed(relPath) {
	const normalized = relPath.replace(/\\/g, '/');
	if (ALLOWED_FILES.has(normalized)) return true;
	if (ALLOWED_PREFIXES.some((p) => normalized.startsWith(p))) return true;
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
		if (!FONT_RE.test(text)) continue;

		const hits = [...text.matchAll(FONT_RE)].map((m) => m[0]);
		const unique = [...new Set(hits)];
		errors.push(`${rel}: ${unique.join(', ')}`);
	}
}

if (errors.length > 0) {
	console.error('Brand font check failed — define fonts in src/lib/design/brand/typography.ts:\n');
	for (const err of errors) console.error(`  ${err}`);
	process.exit(1);
}

console.log('Brand font check passed.');
