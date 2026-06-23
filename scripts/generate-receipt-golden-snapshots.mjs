/**
 * Generate golden receipt parse snapshots (no PII) for regression.
 * Run: node scripts/generate-receipt-golden-snapshots.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = join(root, 'tests/fixtures/receipts');
const expectedDir = join(fixturesDir, 'expected');
const manifest = JSON.parse(readFileSync(join(fixturesDir, 'manifest.json'), 'utf8'));

mkdirSync(expectedDir, { recursive: true });

const { extractPdfText } = require(join(root, 'build/server/chunks/receipt-pdf.js'));
const { preprocessReceiptText } = require(join(root, 'src/lib/server/receipt-parse.ts'));

async function buildSnapshot(pdfPath, fileName) {
	const bytes = new Uint8Array(readFileSync(pdfPath));
	let textLength = 0;
	let preprocessedLength = 0;
	let printedBbfCount = 0;

	try {
		const { extractPdfText: extract } = await import(
			join(root, 'src/lib/server/receipt-pdf.ts').replace(/\\/g, '/')
		);
		const { preprocessReceiptText: preprocess } = await import(
			join(root, 'src/lib/server/receipt-parse.ts').replace(/\\/g, '/')
		);
		const { extractPrintedBbfDatesFromReceiptText } = await import(
			join(root, 'src/lib/domain/receipt-printed-bbf.ts').replace(/\\/g, '/')
		);
		const extracted = await extract(bytes);
		if (extracted.ok) {
			textLength = extracted.text.length;
			const cleaned = preprocess(extracted.text);
			preprocessedLength = cleaned.length;
			printedBbfCount = extractPrintedBbfDatesFromReceiptText(extracted.text).length;
		}
	} catch (err) {
		console.warn(`  skip dynamic import for ${fileName}:`, err.message);
	}

	return {
		file: fileName,
		textLength,
		preprocessedLength,
		printedBbfCount,
		generatedAt: new Date().toISOString()
	};
}

const pdfs = [
	...(manifest.committedSynthetic ?? []).map((s) => s.file),
	...(manifest.slots ?? []).filter((s) => existsSync(join(fixturesDir, s.file))).map((s) => s.file)
];

console.log(`Generating golden snapshots for ${pdfs.length} PDF(s)...\n`);

for (const fileName of pdfs) {
	const pdfPath = join(fixturesDir, fileName);
	if (!existsSync(pdfPath)) continue;
	const snapshot = await buildSnapshot(pdfPath, fileName);
	const outPath = join(expectedDir, `${basename(fileName, '.pdf')}.json`);
	writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
	console.log(`  ✓ ${outPath}`);
}

console.log('\nDone. Commit tests/fixtures/receipts/expected/*.json (no PII).');
