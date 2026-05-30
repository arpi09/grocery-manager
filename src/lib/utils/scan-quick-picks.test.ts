import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveFavoriteProduct } from './favorite-products';
import { addRecentScan } from './recent-scans';
import { getScanQuickPicks } from './scan-quick-picks';

describe('scan-quick-picks', () => {
	let storage: Record<string, string>;

	beforeEach(() => {
		storage = {};
		vi.stubGlobal('window', {});
		vi.stubGlobal('localStorage', {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			}
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns empty list when nothing is stored', () => {
		expect(getScanQuickPicks()).toEqual([]);
	});

	it('prioritizes favorites and merges recent scans without duplicates', () => {
		saveFavoriteProduct({
			barcode: '7310862000001',
			name: 'Favorit mjölk',
			quantity: '1.5',
			unit: 'l',
			notes: null,
			savedAt: 100
		});
		addRecentScan({ barcode: '7310862000002', name: 'Ost', scannedAt: 200 });
		addRecentScan({ barcode: '7310862000001', name: 'Gammalt namn', scannedAt: 50 });

		const picks = getScanQuickPicks();
		expect(picks).toHaveLength(2);
		expect(picks[0]).toMatchObject({
			barcode: '7310862000001',
			name: 'Favorit mjölk',
			source: 'favorite'
		});
		expect(picks[1]).toMatchObject({
			barcode: '7310862000002',
			name: 'Ost',
			source: 'recent'
		});
	});
});
