import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addRecentScan, getRecentScans, removeRecentScan } from './recent-scans';

describe('recent-scans', () => {
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
		expect(getRecentScans()).toEqual([]);
	});

	it('adds scans newest first and dedupes by barcode', () => {
		addRecentScan({ barcode: '7310862000001', name: 'Bröd', scannedAt: 100 });
		addRecentScan({ barcode: '7310862000002', name: 'Ost', scannedAt: 200 });
		addRecentScan({ barcode: '7310862000001', name: 'Bröd fullkorn', scannedAt: 300 });

		const scans = getRecentScans();
		expect(scans).toHaveLength(2);
		expect(scans[0]?.barcode).toBe('7310862000001');
		expect(scans[0]?.name).toBe('Bröd fullkorn');
		expect(scans[1]?.barcode).toBe('7310862000002');
	});

	it('removes a recent scan', () => {
		addRecentScan({ barcode: '7310862000001', name: 'Bröd' });
		removeRecentScan('7310862000001');
		expect(getRecentScans()).toEqual([]);
	});
});
