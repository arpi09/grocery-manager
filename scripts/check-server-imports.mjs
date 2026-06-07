/**
 * Static guard: forbid .server imports in Svelte components and Node APIs in client code.
 * Run: node scripts/check-server-imports.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_ROOTS = ['src'];

const SERVER_IMPORT_IN_SVELTE = /from\s+['"][^'"]*\.server(?:\.[jt]s)?['"]/g;
const NODE_FS = /node:fs|from\s+['"]fs['"]/;
const PROCESS_CWD = /process\.cwd\s*\(/;

function isAllowedNodeFile(relPath) {
	const normalized = relPath.replace(/\\/g, '/');
	if (normalized.endsWith('.server.ts') || normalized.endsWith('.server.js')) return true;
	if (/\.(test|integration\.test)\.(ts|js)$/.test(normalized)) return true;
	if (normalized.includes('/scripts/') || normalized.startsWith('scripts/')) return true;
	if (normalized.includes('/e2e/') || normalized.startsWith('e2e/')) return true;
	if (normalized.includes('/tests/') || normalized.startsWith('tests/')) return true;
	if (normalized.startsWith('src/lib/infrastructure/')) return true;
	if (normalized.startsWith('src/lib/server/')) return true;
	if (normalized.startsWith('src/lib/test/')) return true;
	if (normalized === 'src/hooks.server.ts') return true;
	if (/\/\+(server|page\.server|layout\.server)\.(ts|js)$/.test(normalized)) return true;
	return false;
}

function collectFiles(dir, files = []) {
	if (!existsSync(dir)) return files;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === 'node_modules' || entry.name === '.svelte-kit' || entry.name === 'build') {
				continue;
			}
			collectFiles(path, files);
		} else if (entry.isFile() && /\.(svelte|ts|js|mjs|cjs)$/.test(entry.name)) {
			files.push(path);
		}
	}
	return files;
}

const errors = [];

for (const scanRoot of SCAN_ROOTS) {
	const absRoot = join(root, scanRoot);
	for (const file of collectFiles(absRoot)) {
		const rel = relative(root, file).replace(/\\/g, '/');
		const text = readFileSync(file, 'utf8');

		if (rel.endsWith('.svelte')) {
			for (const match of text.matchAll(SERVER_IMPORT_IN_SVELTE)) {
				errors.push(`${rel}: forbidden .server import in Svelte — "${match[0]}"`);
			}
		}

		if (!isAllowedNodeFile(rel)) {
			if (NODE_FS.test(text)) {
				errors.push(`${rel}: node:fs/fs import outside server-only paths`);
			}
			if (PROCESS_CWD.test(text)) {
				errors.push(`${rel}: process.cwd() outside server-only paths`);
			}
		}
	}
}

if (errors.length > 0) {
	console.error('::error::Server import guard failed:');
	for (const err of errors) {
		console.error(`  ${err}`);
	}
	process.exit(1);
}

console.log('Server import guard passed.');
