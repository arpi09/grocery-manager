/** Latest non-null lastSeenAt across user rows, or null if none. */
export function latestLastSeenAt(
	rows: ReadonlyArray<{ lastSeenAt: Date | null }>
): Date | null {
	let latest: Date | null = null;

	for (const row of rows) {
		if (row.lastSeenAt && (!latest || row.lastSeenAt > latest)) {
			latest = row.lastSeenAt;
		}
	}

	return latest;
}
