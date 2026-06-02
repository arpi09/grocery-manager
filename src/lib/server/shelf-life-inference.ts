import { guessShelfLife } from '$lib/domain/shelf-life';
import type { StorageLocation } from '$lib/domain/location';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';

export async function inferShelfLife(input: {
	name: string;
	location: StorageLocation;
}): Promise<{ expiresOn: string; source: ExpiresOnSource } | null> {
	return guessShelfLife(input.name, input.location);
}
