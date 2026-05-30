/**
 * Validates receipt PDF fixture pack against manifest.json.
 * Run: node scripts/validate-receipt-fixtures.mjs [--strict]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = join(root, 'tests/fixtures/receipts');
const manifestPath = join(fixturesDir, 'manifest.json');
const strict = process.argv.includes('--strict');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const onDisk = new Set(
	readdirSync(fixturesDir).filter((name) => name.toLowerCase().endsWith('.pdf'))
);

const slots = manifest.slots ?? [];
const synthetic = manifest.committedSynthetic ?? [];
const targetCount = manifest.targetCount ?? slots.length;

console.log(`Receipt fixture pack — target ${targetCount} real PDFs\n`);

let missingReal = 0;
let presentReal = 0;

for (const slot of slots) {
	const present = onDisk.has(slot.file);
	if (present) {
		presentReal++;
		console.log(`  ✓ ${slot.file} (${slot.store})`);
	} else {
		missingReal++;
		console.log(`  ✗ ${slot.file} (${slot.store}) — missing`);
	}
}

console.log(`\nReal PDFs: ${presentReal}/${slots.length} present, ${missingReal} missing`);

let missingSynthetic = 0;
console.log('\nCommitted synthetic (CI):');
for (const entry of synthetic) {
	const present = onDisk.has(entry.file);
	if (present) {
		console.log(`  ✓ ${entry.file}`);
	} else {
		missingSynthetic++;
		console.log(`  ✗ ${entry.file} — missing (run generate-synthetic-receipt-pdfs.mjs)`);
	}
}

const extra = [...onDisk].filter(
	(name) => !slots.some((s) => s.file === name) && !synthetic.some((s) => s.file === name)
);
if (extra.length) {
	console.log('\nExtra PDFs (not in manifest slots):');
	for (const name of extra.sort()) {
		console.log(`  • ${name}`);
	}
}

console.log(`\nTotal PDFs on disk: ${onDisk.size}`);

if (missingSynthetic > 0) {
	console.error('\nERROR: committed synthetic fixtures missing — CI will fail.');
	process.exit(1);
}

if (strict && missingReal > 0) {
	console.error(`\nSTRICT: ${missingReal} real PDF slot(s) still empty.`);
	process.exit(1);
}

if (missingReal > 0) {
	console.log('\nTip: add anonymized PDFs locally — see docs/RECEIPT_TEST_PACK.md');
}

process.exit(0);
