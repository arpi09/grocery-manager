import { describe, expect, it } from 'vitest';
import {
	buildPantryTileDetailPresentation,
	formatPantryTileQuantityLine,
	pantryZoneTitleKey
} from './pantry-shelf-presenter';
import type { PantryTilePresentation } from './pantry-shelf';

function tile(overrides: Partial<PantryTilePresentation>): PantryTilePresentation {
	return {
		itemId: '1',
		name: 'Milk',
		warn: false,
		detailKind: 'none',
		expiresInDays: null,
		expiresOn: null,
		quantity: '',
		unit: null,
		...overrides
	};
}

describe('pantry-shelf-presenter', () => {
	it('maps zone locations to i18n keys', () => {
		expect(pantryZoneTitleKey('fridge')).toBe('pantry.v2.zone.fridge');
		expect(pantryZoneTitleKey('freezer')).toBe('pantry.v2.zone.freezer');
		expect(pantryZoneTitleKey('cupboard')).toBe('pantry.v2.zone.cupboard');
	});

	it('selects detail line keys for expiry and freezer tiles', () => {
		expect(buildPantryTileDetailPresentation(tile({ detailKind: 'expires_today' }))).toEqual({
			key: 'pantry.v2.tile.expiresToday',
			params: {}
		});
		expect(
			buildPantryTileDetailPresentation(
				tile({ detailKind: 'expires_days', expiresInDays: 3 })
			)
		).toEqual({
			key: 'pantry.v2.tile.expiresDays',
			params: { days: 3 }
		});
		expect(buildPantryTileDetailPresentation(tile({ detailKind: 'frozen' }))).toEqual({
			key: 'pantry.v2.tile.frozen',
			params: {}
		});
		expect(buildPantryTileDetailPresentation(tile({ detailKind: 'missing_expiry' }))).toEqual({
			key: 'pantry.v2.tile.missingExpiry',
			params: {}
		});
		expect(buildPantryTileDetailPresentation(tile({ detailKind: 'expires_date', expiresOn: '2026-07-01' }))).toBeNull();
		expect(buildPantryTileDetailPresentation(tile({ detailKind: 'quantity' }))).toBeNull();
	});

	it('formats quantity lines with optional units', () => {
		expect(
			formatPantryTileQuantityLine(
				tile({ detailKind: 'quantity', quantity: '5', unit: 'dl' })
			)
		).toBe('5 dl');
		expect(
			formatPantryTileQuantityLine(tile({ detailKind: 'quantity', quantity: '2', unit: null }))
		).toBe('2');
	});
});
