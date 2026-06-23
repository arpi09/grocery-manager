import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractPdfText } from './receipt-pdf';
import { preprocessReceiptText } from './receipt-parse';
import { extractPrintedBbfDatesFromReceiptText } from '$lib/domain/receipt-printed-bbf';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/receipts');
const EXPECTED_DIR = join(FIXTURES_DIR, 'expected');
const MANIFEST = JSON.parse(
	readFileSync(join(FIXTURES_DIR, 'manifest.json'), 'utf8')
) as {
	committedSynthetic: { file: string }[];
	slots?: { file: string }[];
};

function listFixturePdfs(): string[] {
	const onDisk = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.pdf'));
	const slots = (MANIFEST.slots ?? []).map((s) => s.file).filter((f) => onDisk.includes(f));
	const synthetic = MANIFEST.committedSynthetic.map((s) => s.file);
	return [...new Set([...synthetic, ...slots])];
}

describe('receipt golden snapshots', () => {
	const pdfs = listFixturePdfs();

	it.each(pdfs)('%s — text extraction metrics', async (fileName) => {
		const bytes = new Uint8Array(readFileSync(join(FIXTURES_DIR, fileName)));
		const extracted = await extractPdfText(bytes);
		expect(extracted.ok, extracted.ok ? '' : `reason=${extracted.reason}`).toBe(true);
		if (!extracted.ok) return;

		const preprocessed = preprocessReceiptText(extracted.text);
		const printedBbfCount = extractPrintedBbfDatesFromReceiptText(extracted.text).length;

		const expectedPath = join(EXPECTED_DIR, `${basename(fileName, '.pdf')}.json`);
		if (process.env.UPDATE_RECEIPT_GOLDEN === '1') {
			const { writeFileSync, mkdirSync } = await import('node:fs');
			mkdirSync(EXPECTED_DIR, { recursive: true });
			writeFileSync(
				expectedPath,
				JSON.stringify(
					{
						file: fileName,
						textLength: extracted.text.length,
						preprocessedLength: preprocessed.length,
						printedBbfCount,
						generatedAt: new Date().toISOString()
					},
					null,
					2
				)
			);
			return;
		}

		if (!existsSync(expectedPath)) {
			console.warn(`Missing golden ${expectedPath} — run UPDATE_RECEIPT_GOLDEN=1 npm test -- receipt-golden`);
			return;
		}

		const expected = JSON.parse(readFileSync(expectedPath, 'utf8')) as {
			textLength: number;
			preprocessedLength: number;
			printedBbfCount: number;
		};

		expect(extracted.text.length).toBe(expected.textLength);
		expect(Math.abs(preprocessed.length - expected.preprocessedLength)).toBeLessThanOrEqual(
			Math.max(5, Math.round(expected.preprocessedLength * 0.05))
		);
		expect(printedBbfCount).toBe(expected.printedBbfCount);
	}, 20_000);
});
