import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfText } from './receipt-pdf';
import { parseReceiptFromText, parseReceiptLines } from './receipt-parse';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/receipts');
const MANIFEST_PATH = join(FIXTURES_DIR, 'manifest.json');

type ManifestEntry = {
	file: string;
	store: string;
	lineCountMin?: number;
	lineCountMax?: number;
	notes?: string;
};

type Manifest = {
	committedSynthetic: ManifestEntry[];
	slots?: ManifestEntry[];
};

function loadManifest(): Manifest {
	return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function loadFixturePdf(fileName: string): Uint8Array {
	const path = join(FIXTURES_DIR, fileName);
	if (!existsSync(path)) {
		throw new Error(`Fixture missing: ${path}`);
	}
	return new Uint8Array(readFileSync(path));
}

function listLocalManifestPdfs(manifest: Manifest): ManifestEntry[] {
	const onDisk = new Set(
		readdirSync(FIXTURES_DIR).filter((name) => name.toLowerCase().endsWith('.pdf'))
	);

	const realSlots = (manifest.slots ?? []).filter((slot) => onDisk.has(slot.file));
	return [...manifest.committedSynthetic, ...realSlots];
}

describe('receipt PDF fixtures', () => {
	const manifest = loadManifest();
	const fixtures = listLocalManifestPdfs(manifest);

	it('has committed synthetic fixtures for CI', () => {
		expect(manifest.committedSynthetic.length).toBeGreaterThanOrEqual(2);
		for (const entry of manifest.committedSynthetic) {
			expect(existsSync(join(FIXTURES_DIR, entry.file)), entry.file).toBe(true);
		}
	});

	describe.each(fixtures.map((f) => [f.file, f] as const))('%s — extractPdfText', (fileName, entry) => {
		it('extracts non-empty text', async () => {
			const result = await extractPdfText(loadFixturePdf(fileName));

			expect(result.ok, result.ok ? '' : `reason=${result.reason}`).toBe(true);
			if (!result.ok) return;

			expect(result.text.length).toBeGreaterThan(0);
			expect(entry.store.length).toBeGreaterThan(0);
		});
	});
});

const openAiKey = process.env.OPENAI_API_KEY?.trim();

describe.skipIf(!openAiKey)('receipt PDF fixtures — OpenAI integration', () => {
	const manifest = loadManifest();
	const fixtures = listLocalManifestPdfs(manifest);

	describe.each(fixtures.map((f) => [f.file, f] as const))('%s — parseReceiptFromText', (fileName) => {
		it('returns valid lines structure', async () => {
			const extracted = await extractPdfText(loadFixturePdf(fileName));
			expect(extracted.ok).toBe(true);
			if (!extracted.ok) return;

			const raw = await parseReceiptFromText(openAiKey!, extracted.text);
			const lines = parseReceiptLines(raw);

			expect(Array.isArray(lines)).toBe(true);
			for (const line of lines) {
				expect(typeof line.name).toBe('string');
				expect(line.name.length).toBeGreaterThan(0);
			}
		});
	});
});
