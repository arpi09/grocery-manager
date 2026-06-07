/**
 * Fail if Node/server-only code leaked into the client bundle.
 * Run after `npm run build`: node scripts/check-client-bundle.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CLIENT_DIRS = [
	join(root, '.svelte-kit', 'output', 'client'),
	join(root, 'build', 'client')
];

/** Substrings that must never appear in shipped client JS. */
const FORBIDDEN = [
	'process.cwd',
	'node:fs',
	'guides.server',
	'readFileSync'
];

function collectJsFiles(dir, files = []) {
	if (!existsSync(dir)) return files;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			collectJsFiles(path, files);
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			files.push(path);
		}
	}
	return files;
}

const clientRoots = CLIENT_DIRS.filter((dir) => existsSync(dir));
if (clientRoots.length === 0) {
	console.error(
		'::error::No client bundle found. Run `npm run build` first (expected .svelte-kit/output/client or build/client).'
	);
	process.exit(1);
}

const errors = [];

for (const clientRoot of clientRoots) {
	const jsFiles = collectJsFiles(clientRoot);
	for (const file of jsFiles) {
		const text = readFileSync(file, 'utf8');
		const rel = file.slice(root.length + 1).replace(/\\/g, '/');
		for (const pattern of FORBIDDEN) {
			if (text.includes(pattern)) {
				errors.push(`${rel}: forbidden client bundle pattern "${pattern}"`);
			}
		}
	}
}

if (errors.length > 0) {
	console.error('::error::Client bundle guard failed — server/Node code in client chunks:');
	for (const err of errors) {
		console.error(`  ${err}`);
	}
	process.exit(1);
}

console.log(`Client bundle guard passed (${clientRoots.length} root(s) scanned).`);
