import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { StorageLocation } from '$lib/domain/location';

export interface ShelfLifeInferencePort {
	inferShelfLife(input: {
		name: string;
		location: StorageLocation;
	}): Promise<{ expiresOn: string; source: ExpiresOnSource } | null>;
}
