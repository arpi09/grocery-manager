export const LOCATIONS = ['fridge', 'freezer', 'cupboard'] as const;

export type StorageLocation = (typeof LOCATIONS)[number];

export function isStorageLocation(value: string): value is StorageLocation {
	return (LOCATIONS as readonly string[]).includes(value);
}

export const LOCATION_LABELS: Record<StorageLocation, string> = {
	fridge: 'Fridge',
	freezer: 'Freezer',
	cupboard: 'Cupboard'
};

export const LOCATION_COLORS: Record<StorageLocation, string> = {
	fridge: 'var(--color-fridge)',
	freezer: 'var(--color-freezer)',
	cupboard: 'var(--color-cupboard)'
};
