/**
 * Fail on UTF-8 replacement chars and common mojibake in locale/marketing copy.
 * Run: node scripts/check-locale-encoding.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
	'src/lib/i18n/locales/en.json',
	'src/lib/i18n/locales/sv.json',
	'src/lib/marketing/content.ts',
	'src/lib/marketing/pricing-content.ts'
];

/** Patterns that indicate broken encoding (UTF-8 read as Latin-1, etc.). */
const MOJIBAKE = [
	/\uFFFD/u,
	/Ã¤|Ã¶|Ã¥|Ã„|Ã–|Ã…/u,
	/â€™|â€"|â€œ|â€\u009d/u,
	/ï¿½/u,
	/Â(?=[a-zA-Z])/u
];

const errors = [];

for (const rel of TARGETS) {
	const path = join(root, rel);
	let text;
	try {
		text = readFileSync(path, 'utf8');
	} catch (err) {
		errors.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
		continue;
	}

	for (const pattern of MOJIBAKE) {
		const match = text.match(pattern);
		if (match) {
			const index = text.indexOf(match[0]);
			const line = text.slice(0, index).split('\n').length;
			errors.push(`${rel}:${line}: mojibake "${match[0]}" (${pattern})`);
		}
	}
}

if (errors.length > 0) {
	console.error('Locale encoding check failed:\n');
	for (const err of errors) {
		console.error(`  ✗ ${err}`);
	}
	process.exit(1);
}

console.log(`Locale encoding OK (${TARGETS.length} files)`);
