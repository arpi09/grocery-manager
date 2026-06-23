/**
 * Copy owner ICA PDF pack from Downloads → private/receipts + manifest slots.
 * PII stays local — never commit PDFs. Run: node scripts/import-receipt-fixtures.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const downloads = join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'Downloads');
const inbox = join(root, 'private/receipts/inbox');
const archive = join(root, 'private/receipts/archive');
const fixtures = join(root, 'tests/fixtures/receipts');

/** Match Downloads filename by normalized substring (handles å/ä/ö encoding drift). */
function findDownloadPdf(substrings, options = {}) {
	const { excludeDuplicate = false } = options;
	const files = readdirSync(downloads).filter((f) => f.toLowerCase().endsWith('.pdf'));
	const norm = (s) =>
		s
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]/g, '');
	const needles = substrings.map(norm);
	const matches = [];
	for (const file of files) {
		if (excludeDuplicate && /\(\s*1\s*\)/.test(file)) continue;
		const hay = norm(file);
		if (needles.every((n) => hay.includes(n))) matches.push(join(downloads, file));
	}
	if (matches.length === 0 && excludeDuplicate) {
		return findDownloadPdf(substrings, { excludeDuplicate: false });
	}
	return matches[0] ?? null;
}

const MANIFEST_SLOTS = [
	{ slot: 'ica-01.pdf', match: ['toftanas', '20260529'] },
	{ slot: 'ica-02.pdf', match: ['gunnesbo', '20260325', '1'] },
	{ slot: 'ica-03.pdf', match: ['gunnesbo', '20260325'], exclude: ['1'] },
	{ slot: 'ica-04.pdf', match: ['varnhem', '20260415'] },
	{ slot: 'ica-05.pdf', match: ['toftanas', '20260422'] },
	{ slot: 'ica-06.pdf', match: ['toftanas', '20260426'] },
	{ slot: 'ica-07.pdf', match: ['gunnesbo', '20260428'] },
	{ slot: 'kivra-01.pdf', match: ['toftanas', '20260505', '1'] },
	{ slot: 'kivra-02.pdf', match: ['toftanas', '20260505'], exclude: ['1'] },
	{ slot: 'kivra-03.pdf', match: ['toftanas', '20260519'] },
	{ slot: 'kivra-04.pdf', match: ['gunnesbo', '20260528'] }
];

const ARCHIVE = [
	{ name: 'ica-maxi-gunnesbo-2025-06-30.pdf', match: ['gunnesbo', '20250630'] },
	{ name: 'ica-maxi-gunnesbo-2025-07-02.pdf', match: ['gunnesbo', '20250702'] },
	{ name: 'ica-kvantum-stromstad-2025-08-05.pdf', match: ['stromstad', '20250805'] },
	{ name: 'ica-maxi-gunnesbo-2025-08-09.pdf', match: ['gunnesbo', '20250809'] },
	{ name: 'ica-maxi-gunnesbo-2025-08-14.pdf', match: ['gunnesbo', '20250814'] },
	{ name: 'ica-maxi-gunnesbo-2025-08-17.pdf', match: ['gunnesbo', '20250817'] },
	{ name: 'ica-maxi-gunnesbo-2025-08-27.pdf', match: ['gunnesbo', '20250827'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-07.pdf', match: ['gunnesbo', '20251107'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-10.pdf', match: ['gunnesbo', '20251110'], exclude: ['1'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-10-b.pdf', match: ['gunnesbo', '20251110', '1'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-15.pdf', match: ['gunnesbo', '20251115'], exclude: ['1'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-15-b.pdf', match: ['gunnesbo', '20251115', '1'] },
	{ name: 'ica-maxi-gunnesbo-2025-11-24.pdf', match: ['gunnesbo', '20251124'] }
];

function resolveEntry(entry) {
	const src = findDownloadPdf(entry.match, {
		excludeDuplicate: Boolean(entry.exclude?.includes('1'))
	});
	if (!src) return null;
	if (entry.exclude?.includes('1') && /\(\s*1\s*\)/.test(src)) return null;
	if (entry.exclude?.includes('1') === false && entry.match.includes('1')) {
		if (!/\(\s*1\s*\)/.test(src)) return null;
	}
	return src;
}

mkdirSync(inbox, { recursive: true });
mkdirSync(archive, { recursive: true });
mkdirSync(fixtures, { recursive: true });

const sourcesLocal = {};
let copiedInbox = 0;
let missing = [];

for (const file of readdirSync(downloads).filter((f) => f.toLowerCase().endsWith('.pdf'))) {
	const lower = file.toLowerCase();
	if (
		lower.includes('ica') &&
		(lower.includes('gunnesbo') ||
			lower.includes('toftan') ||
			lower.includes('varnhem') ||
			lower.includes('stromstad') ||
			lower.includes('str'))
	) {
		const dest = join(inbox, file);
		if (!existsSync(dest)) {
			copyFileSync(join(downloads, file), dest);
			copiedInbox++;
		}
	}
}

console.log(`Inbox: ${copiedInbox} ICA PDF(s) copied to private/receipts/inbox/\n`);

for (const entry of MANIFEST_SLOTS) {
	const src = resolveEntry(entry);
	if (!src) {
		missing.push(entry.slot);
		console.log(`  ✗ ${entry.slot} — source not found in Downloads`);
		continue;
	}
	const dest = join(fixtures, entry.slot);
	copyFileSync(src, dest);
	sourcesLocal[entry.slot] = { channel: 'ica', sourceFile: src.split(/[/\\]/).pop() };
	console.log(`  ✓ ${entry.slot} ← ${src.split(/[/\\]/).pop()}`);
}

console.log('\nArchive:');
for (const entry of ARCHIVE) {
	const src = resolveEntry(entry);
	if (!src) {
		console.log(`  ✗ ${entry.name} — missing`);
		continue;
	}
	copyFileSync(src, join(archive, entry.name));
	console.log(`  ✓ ${entry.name}`);
}

writeFileSync(
	join(fixtures, 'SOURCES.local.json'),
	JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), slots: sourcesLocal }, null, 2)
);

console.log(`\nWrote SOURCES.local.json (${Object.keys(sourcesLocal).length} slots)`);
if (missing.length) {
	console.log(`\nMissing manifest slots: ${missing.join(', ')}`);
	process.exitCode = 1;
}
