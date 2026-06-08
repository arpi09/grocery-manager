export interface SyncFunnelCounts {
	householdsWithWrite7d: number;
	householdsWithBatchReview7d: number;
	householdsWithWrite30d: number;
}

export interface SyncFunnelSnapshot {
	conversionToBatchReview: number | null;
	counts: SyncFunnelCounts;
}

export function buildSyncFunnelSnapshot(counts: SyncFunnelCounts): SyncFunnelSnapshot {
	const conversionToBatchReview =
		counts.householdsWithWrite7d > 0
			? counts.householdsWithBatchReview7d / counts.householdsWithWrite7d
			: null;
	return { conversionToBatchReview, counts };
}
