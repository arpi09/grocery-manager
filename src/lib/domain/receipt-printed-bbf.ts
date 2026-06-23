/**
 * Extract printed best-before dates from ICA/Kivra receipt text lines.
 * Patterns: YYYY-MM-DD, BF YYMMDD, BBF YYMMDD, bäst före YY-MM-DD.
 */

const ISO_DATE = /\b(20\d{2})[-/.](\d{2})[-/.](\d{2})\b/g;
const BF_COMPACT = /\b(?:BF|BBF|B\.F\.|B\.B\.F\.)\s*(\d{2})(\d{2})(\d{2})\b/gi;
const BF_LABEL =
	/\bb(?:ä|a)st\s*f(?:ö|o)re\s*(?:datum\s*)?(?:[:.]?\s*)?(20\d{2})[-/.](\d{2})[-/.](\d{2}|\d{2})/gi;

function toIso(y: string, m: string, d: string): string | null {
	const year = y.length === 2 ? Number(`20${y}`) : Number(y);
	const month = Number(m);
	const day = Number(d);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	const parsed = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return iso;
}

function collectDates(text: string): string[] {
	const found = new Set<string>();
	let m: RegExpExecArray | null;

	ISO_DATE.lastIndex = 0;
	while ((m = ISO_DATE.exec(text)) !== null) {
		const iso = toIso(m[1], m[2], m[3]);
		if (iso) found.add(iso);
	}

	BF_COMPACT.lastIndex = 0;
	while ((m = BF_COMPACT.exec(text)) !== null) {
		const iso = toIso(m[1], m[2], m[3]);
		if (iso) found.add(iso);
	}

	BF_LABEL.lastIndex = 0;
	while ((m = BF_LABEL.exec(text)) !== null) {
		const iso = toIso(m[1], m[2], m[3]);
		if (iso) found.add(iso);
	}

	return [...found];
}

/** All BBF dates found in receipt text (deduped, sorted). */
export function extractPrintedBbfDatesFromReceiptText(text: string): string[] {
	return collectDates(text).sort();
}

/**
 * Best-effort: pick a printed BBF date near a product name in raw receipt text.
 * ICA lines often place the date on the same line or the following fragment.
 */
export function extractPrintedBbfForProductLine(
	receiptText: string,
	productName: string
): string | null {
	const normalizedName = productName.trim().toLowerCase();
	if (!normalizedName || normalizedName.length < 3) return null;

	const lower = receiptText.toLowerCase();
	const idx = lower.indexOf(normalizedName);
	if (idx < 0) {
		const firstToken = normalizedName.split(/\s+/)[0];
		if (firstToken.length < 4) return null;
		const tokenIdx = lower.indexOf(firstToken);
		if (tokenIdx < 0) return null;
		return pickNearestDate(receiptText.slice(tokenIdx, tokenIdx + 120));
	}

	return pickNearestDate(receiptText.slice(idx, idx + 120));
}

function pickNearestDate(fragment: string): string | null {
	const dates = collectDates(fragment);
	if (dates.length === 0) return null;
	return dates[0];
}
