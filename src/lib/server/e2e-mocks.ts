import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	parseShoppingSuggestionNote,
	parseShoppingSuggestions,
	type ShoppingSuggestion
} from '$lib/server/shopping-suggestions';
import { parseReceiptLines } from '$lib/server/receipt-parse';
import type { ReceiptLine } from '$lib/domain/receipt-line';

export function isE2eMockAiEnabled(): boolean {
	return process.env.E2E_MOCK_AI === 'true';
}

function loadShoppingSuggestionsFixture(): {
	items: ShoppingSuggestion[];
	note: string | null;
} {
	const path = join(process.cwd(), 'e2e/fixtures/shopping-suggestions.json');
	const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
	const items = parseShoppingSuggestions(raw);
	const note = parseShoppingSuggestionNote(raw);
	return { items, note };
}

/** Deterministic smart-fill for Playwright (no OPENAI_API_KEY). */
export function e2eMockShoppingSuggestions(): {
	ok: true;
	items: ShoppingSuggestion[];
	note: string | null;
} {
	const { items, note } = loadShoppingSuggestionsFixture();
	if (items.length === 0) {
		throw new Error('e2e/fixtures/shopping-suggestions.json produced zero items');
	}
	return { ok: true, items, note };
}

function loadReceiptParseFixture(): ReceiptLine[] {
	const path = join(process.cwd(), 'e2e/fixtures/receipt-parse.json');
	const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
	const lines = parseReceiptLines(raw);
	if (lines.length === 0) {
		throw new Error('e2e/fixtures/receipt-parse.json produced zero lines');
	}
	return lines;
}

/** Deterministic receipt parse for Playwright (no OPENAI_API_KEY). */
export function e2eMockReceiptParse(): ReceiptLine[] {
	return loadReceiptParseFixture();
}
