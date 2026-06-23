import type { ExpiresOnSource } from '$lib/domain/auto-expired';

export function isEstimatedExpirySource(source: ExpiresOnSource | null | undefined): boolean {
	return (
		source === 'heuristic' ||
		source === 'household_learned' ||
		source === 'ai_inferred' ||
		source === 'default_heuristic'
	);
}

export function isHighTrustExpirySource(source: ExpiresOnSource | null | undefined): boolean {
	return source === 'user_set' || source === 'receipt_printed';
}
