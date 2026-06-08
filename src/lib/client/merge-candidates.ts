import type { StorageLocation } from '$lib/domain/location';

export interface MergeCandidateMatch {
	index: number;
	id: string;
	name: string;
	quantity: string;
	unit: string | null;
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
