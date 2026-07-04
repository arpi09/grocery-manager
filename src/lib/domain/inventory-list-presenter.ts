import { formatNumericQuantity, parseNumericQuantity } from '$lib/domain/consumption-quantity';
import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { daysUntilExpiry, EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { buildPantryTileDetailPresentation } from '$lib/domain/pantry-shelf-presenter';
import type { PantryTilePresentation } from '$lib/domain/pantry-shelf';
import type { Locale } from '$lib/i18n/locale';
import { translate } from '$lib/i18n/messages';

/** "1.00" → "1", "32.00" → "32", "1.50" → "1.5" — keeps non-numeric quantities as-is. */
export function formatInventoryQuantityAmount(quantity: string): string {
	const stock = parseNumericQuantity(quantity);
	if (stock === null) {
		return quantity.trim();
	}
	return formatNumericQuantity(stock);
}

export function formatInventoryListQuantity(
	item: Pick<InventoryItem, 'quantity' | 'unit'>,
	locale: Locale
): string {
	const unitSuffix = item.unit ? ` ${item.unit}` : '';
	const amount = `${formatInventoryQuantityAmount(item.quantity)}${unitSuffix}`.trim();
	if (!amount) {
		return '';
	}

	const stock = parseNumericQuantity(item.quantity);
	if (stock !== null && stock > 0) {
		return translate(locale, 'inventory.quantityLeft', { amount });
	}

	return amount;
}

/** Compact date for the row meta line: "24 juni" — year only when it differs from today's. */
export function formatCompactExpiryDate(
	expiresOn: string,
	locale: Locale,
	today = new Date()
): string {
	const [year, month, day] = expiresOn.split('-').map(Number);
	const tag = locale === 'sv' ? 'sv-SE' : 'en-GB';
	const options: Intl.DateTimeFormatOptions =
		year === today.getFullYear()
			? { day: 'numeric', month: 'short' }
			: { day: 'numeric', month: 'short', year: 'numeric' };
	return new Intl.DateTimeFormat(tag, options).format(new Date(year, month - 1, day));
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
		expiresOn,
		detailKind: days === 0 ? 'expires_today' : 'expires_days',
		expiresInDays: days,
		expiresOnSource: null,
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
		date: formatCompactExpiryDate(item.expiresOn, locale, today)
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
