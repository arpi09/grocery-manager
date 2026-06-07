import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Matches manifest slots in docs/RECEIPT_TEST_PACK.md (gitignored locally). */
const REAL_RECEIPT_PDF_PATTERN = /^(ica|kivra|willys)-\d+\.pdf$/i;

export const RECEIPT_FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/receipts');

/**
 * Lists anonymized real receipt PDFs on disk.
 * CI has none — e2e/receipt-real-fixtures.spec.ts skips until owner adds files locally.
 * See docs/RECEIPT_TEST_PACK.md.
 */
export function listRealReceiptPdfs(fixturesDir = RECEIPT_FIXTURES_DIR): string[] {
	if (!existsSync(fixturesDir)) return [];

	return readdirSync(fixturesDir)
		.filter((name) => name.toLowerCase().endsWith('.pdf'))
		.filter((name) => !name.startsWith('synthetic-'))
		.filter((name) => REAL_RECEIPT_PDF_PATTERN.test(name))
		.sort();
}

export function hasRealReceiptFixtures(fixturesDir = RECEIPT_FIXTURES_DIR): boolean {
	return listRealReceiptPdfs(fixturesDir).length > 0;
}
