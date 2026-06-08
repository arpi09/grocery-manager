export type SyncHealthLevel = 'good' | 'needs_love';

export function computeSyncHealthLevel(input: {
	totalItems: number;
	withoutExpiryCount: number;
	staleCount: number;
}): SyncHealthLevel {
	if (input.totalItems === 0) return 'good';
	if (input.staleCount > 0) return 'needs_love';
	if (input.withoutExpiryCount / input.totalItems > 0.35) return 'needs_love';
	return 'good';
}
