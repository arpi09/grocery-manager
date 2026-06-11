const STORE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
	{ label: 'ICA', pattern: /\bica\b/i },
	{ label: 'Coop', pattern: /\bcoop\b/i },
	{ label: 'Willys', pattern: /\bwillys\b/i },
	{ label: 'Hemköp', pattern: /\bhemk[oö]p\b/i },
	{ label: 'Lidl', pattern: /\blidl\b/i },
	{ label: 'City Gross', pattern: /\bcity\s+gross\b/i }
];

const RECEIPT_DATE_PATTERNS = [
	/\b(20\d{2})[-/.](\d{2})[-/.](\d{2})\b/,
	/\b(\d{2})[-/.](\d{2})[-/.](20\d{2})\b/
];

export function extractStoreFromReceiptText(receiptText: string): string | undefined {
	const header = receiptText.slice(0, 1200);
	for (const candidate of STORE_PATTERNS) {
		if (candidate.pattern.test(header)) {
			return candidate.label;
		}
	}
	return undefined;
}

export function extractPurchasedAtFromReceiptText(receiptText: string): Date | undefined {
	const header = receiptText.slice(0, 2500);
	for (const pattern of RECEIPT_DATE_PATTERNS) {
		const match = pattern.exec(header);
		if (!match) continue;
		const [, a, b, c] = match;
		const iso = match[0].startsWith('20') ? `${a}-${b}-${c}` : `${c}-${b}-${a}`;
		const parsed = new Date(`${iso}T12:00:00.000Z`);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed;
		}
	}
	return undefined;
}
