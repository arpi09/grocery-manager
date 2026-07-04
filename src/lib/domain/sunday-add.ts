import { SUNDAY_SUGGESTION_MAX, type SundaySource } from './sunday-suggestion';

/**
 * A single Söndagsförslag row the client asks the server to add. The client sends exactly
 * the rows the user saw and tapped (WYSIWYG) — never a hidden superset — so add-all and
 * per-row share one payload shape and there are no silent extra additions.
 */
export interface SundayAddRow {
	source: SundaySource;
	name: string;
	quantity: string;
	normalizedKey: string | null;
	relatedMealDate: string | null;
	relatedRecipeTitle: string | null;
}

function str(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function nullableStr(value: unknown): string | null {
	const trimmed = str(value);
	return trimmed ? trimmed : null;
}

/**
 * Parse and validate the `rows` form field. Returns null on any malformed input rather than
 * throwing, so the action can answer with a clean 400. Caps at SUNDAY_SUGGESTION_MAX to bound
 * a single request to what the panel could plausibly show.
 */
export function parseSundayAddRows(raw: FormDataEntryValue | null): SundayAddRow[] | null {
	if (typeof raw !== 'string' || !raw.trim()) return null;

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (!Array.isArray(parsed)) return null;

	const rows: SundayAddRow[] = [];
	for (const entry of parsed) {
		if (!entry || typeof entry !== 'object') continue;
		const candidate = entry as Record<string, unknown>;
		const source = candidate.source;
		if (source !== 'replenishment' && source !== 'ai') continue;
		const name = str(candidate.name);
		if (!name) continue;

		const normalizedKey = nullableStr(candidate.normalizedKey);
		// A replenishment row is only trustworthy for a learning-backed accept if it carries its key.
		rows.push({
			source,
			name,
			quantity: str(candidate.quantity),
			normalizedKey: source === 'replenishment' ? normalizedKey : null,
			relatedMealDate: nullableStr(candidate.relatedMealDate),
			relatedRecipeTitle: nullableStr(candidate.relatedRecipeTitle)
		});

		if (rows.length >= SUNDAY_SUGGESTION_MAX) break;
	}

	return rows.length > 0 ? rows : null;
}
