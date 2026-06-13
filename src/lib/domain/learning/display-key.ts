/** Human-readable label from a normalized product key (receipt normalization strips casing). */
export function formatNormalizedKeyForDisplay(normalizedKey: string): string {
	const trimmed = normalizedKey.trim();
	if (!trimmed) return trimmed;
	return trimmed
		.split(' ')
		.map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
		.join(' ');
}
