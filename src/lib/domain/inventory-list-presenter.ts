import { parseNumericQuantity } from '$lib/domain/consumption-quantity';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { daysUntilExpiry, EXPIRING_SOON_DAYS, formatExpiryDate } from '$lib/domain/expiry';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { buildPantryTileDetailPresentation } from '$lib/domain/pantry-shelf-presenter';
import type { PantryTilePresentation } from '$lib/domain/pantry-shelf';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

export function formatInventoryListQuantity(
	item: Pick<InventoryItem, 'quantity' | 'unit'>,
	locale: Locale
): string {
	const unitSuffix = item.unit ? ` ${item.unit}` : '';
	const amount = `${item.quantity}${unitSuffix}`.trim();
	if (!amount) {
		return '';
	}

	const stock = parseNumericQuantity(item.quantity);
	if (stock !== null && stock > 0) {
		return translate(locale, 'inventory.quantityLeft', { amount });
	}

	return amount;
}

function soonExpiryTile(expiresOn: string, today = new Date()): PantryTilePresentation | null {
	const days = daysUntilExpiry(expiresOn, today);
	if (days < 0 || days > EXPIRING_SOON_DAYS) {
		return null;
	}

	return {
		itemId: '',
		name: '',
		warn: true,
		detailKind: days === 0 ? 'expires_today' : 'expires_days',
		expiresInDays: days,
		quantity: '',
		unit: null
	};
}

export function formatInventoryListExpiryPart(
	item: Pick<InventoryItem, 'expiresOn'>,
	locale: Locale,
	today = new Date()
): string | null {
	if (!item.expiresOn) {
		return null;
	}

	const soonTile = soonExpiryTile(item.expiresOn, today);
	if (soonTile) {
		const presentation = buildPantryTileDetailPresentation(soonTile);
		if (presentation) {
			return translate(locale, presentation.key, presentation.params);
		}
	}

	return translate(locale, 'inventory.listMetaExpiry', {
		date: formatExpiryDate(item.expiresOn, locale)
	});
}

export function buildInventoryListMetaParts(
	item: Pick<InventoryItem, 'quantity' | 'unit' | 'expiresOn'>,
	locale: Locale,
	today = new Date()
): { quantity: string; expiry: string | null } {
	return {
		quantity: formatInventoryListQuantity(item, locale),
		expiry: formatInventoryListExpiryPart(item, locale, today)
	};
}

export function isInventoryExpiryEstimated(expiresOnSource: ExpiresOnSource | null): boolean {
	return expiresOnSource !== null && expiresOnSource !== 'user_set';
}
