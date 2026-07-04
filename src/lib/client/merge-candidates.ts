import type { StorageLocation } from '$lib/domain/location';

export interface MergeCandidateMatch {
	index: number;
	id: string;
	name: string;
	quantity: string;
	unit: string | null;
	/** Last time the matched pantry item was created/updated/confirmed (ISO). */
	recentAt?: string | null;
}

export const RECENTLY_ADDED_DEDUPE_HOURS = 24;

/** Matched pantry item was touched so recently it was likely just added from this trip. */
export function isRecentMergeCandidate(
	match: MergeCandidateMatch | null,
	now: number = Date.now()
): boolean {
	if (!match?.recentAt) {
		return false;
	}
	const touched = Date.parse(match.recentAt);
	if (!Number.isFinite(touched)) {
		return false;
	}
	return now - touched < RECENTLY_ADDED_DEDUPE_HOURS * 60 * 60 * 1000;
}

export async function fetchMergeCandidates(
	lines: Array<{ name: string; location: StorageLocation }>
): Promise<Array<MergeCandidateMatch | null>> {
	if (lines.length === 0) {
		return [];
	}

	const response = await fetch('/api/inventory/merge-candidates', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ lines })
	});

	if (!response.ok) {
		return lines.map(() => null);
	}

	const data = (await response.json()) as { matches?: Array<MergeCandidateMatch | null> };
	return data.matches ?? lines.map(() => null);
}
