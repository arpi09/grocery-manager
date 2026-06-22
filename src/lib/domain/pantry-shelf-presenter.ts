import type { MessageKey } from '$lib/i18n/messages';
import type { StorageLocation } from './location';
import type { PantryTilePresentation } from './pantry-shelf';

export type PantryTileDetailPresentation = {
	key: MessageKey;
	params: Record<string, string | number>;
};

export function pantryZoneTitleKey(location: StorageLocation): MessageKey {
	return `pantry.v2.zone.${location}` as MessageKey;
}

export function buildPantryTileDetailPresentation(
	tile: PantryTilePresentation
): PantryTileDetailPresentation | null {
	switch (tile.detailKind) {
		case 'expires_today':
			return { key: 'pantry.v2.tile.expiresToday', params: {} };
		case 'expires_days':
			return {
				key: 'pantry.v2.tile.expiresDays',
				params: { days: tile.expiresInDays ?? 0 }
			};
		case 'expires_date':
			return null;
		case 'missing_expiry':
			return { key: 'pantry.v2.tile.missingExpiry', params: {} };
		case 'frozen':
			return { key: 'pantry.v2.tile.frozen', params: {} };
		case 'quantity':
		case 'none':
			return null;
	}
}

export function formatPantryTileQuantityLine(tile: PantryTilePresentation): string {
	if (tile.detailKind !== 'quantity') {
		return '';
	}

	const quantity = tile.quantity.trim();
	if (!quantity) {
		return '';
	}

	const unit = tile.unit?.trim();
	return unit ? `${quantity} ${unit}` : quantity;
}
