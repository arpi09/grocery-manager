import { isStorageLocation, type StorageLocation } from '$lib/domain/location';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type MergeCandidateLine = { name: string; location: StorageLocation };

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.householdId) {
		error(401, 'Unauthorized');
	}

	let body: { lines?: unknown };
	try {
		body = (await request.json()) as { lines?: unknown };
	} catch {
		error(400, 'Invalid JSON');
	}

	const rawLines = body.lines;
	if (!Array.isArray(rawLines) || rawLines.length === 0) {
		return json({ matches: [] });
	}

	const lines: MergeCandidateLine[] = [];
	for (const entry of rawLines) {
		if (
			typeof entry !== 'object' ||
			entry === null ||
			typeof (entry as MergeCandidateLine).name !== 'string' ||
			!isStorageLocation((entry as MergeCandidateLine).location)
		) {
			continue;
		}
		const line = entry as MergeCandidateLine;
		if (!line.name.trim()) {
			continue;
		}
		lines.push({ name: line.name.trim(), location: line.location });
	}

	const matches = await locals.inventoryService.findMergeCandidates(locals.householdId, lines);
	return json({ matches });
};
