import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';
import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';

export type MarketPricingMode = 'free' | 'percent_of_reference' | 'fixed';

export type MarketReferencePriceSource = 'price_memory' | 'manual' | 'none';

export const DEFAULT_PORTION_PERCENT = 100;

export interface MarketListingSettings {
	marketSwishNumber: string | null;
	marketDefaultPricePercent: number | null;
}

export interface MarketItemPricingInput {
	pricingMode?: MarketPricingMode;
	portionPercent?: number;
	portionNote?: string;
	pricePercent?: number;
	referencePriceSek?: number;
	referencePriceSource?: MarketReferencePriceSource;
	askingPriceSek?: number;
	unitPrice?: string | number | null;
	quantity?: string | number;
}

export interface MarketItemPricingFields {
	pricingMode: MarketPricingMode;
	portionPercent?: number;
	portionNote?: string;
	referencePriceSek?: number;
	referencePriceSource?: MarketReferencePriceSource;
	askingPriceSek?: number;
	pricePercent?: number;
}

export function isFreeListingItem(
	item: Pick<ExpiringShareItemSnapshot, 'pricingMode' | 'askingPriceSek'>
): boolean {
	return !item.pricingMode || item.pricingMode === 'free';
}

export function parseListingQuantity(quantity: string | number): number {
	if (typeof quantity === 'number') {
		return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
	}
	const normalized = quantity.trim().replace(',', '.');
	const parsed = Number(normalized);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function calculateReferencePriceSek(
	unitPrice: string | number,
	quantity: string | number
): number | null {
	const unit =
		typeof unitPrice === 'string' ? Number(unitPrice.trim().replace(',', '.')) : unitPrice;
	if (!Number.isFinite(unit) || unit <= 0) {
		return null;
	}
	const qty = parseListingQuantity(quantity);
	const reference = unit * qty;
	return Math.round(reference * 100) / 100;
}

export function calculateAskingPriceSek(
	referencePriceSek: number,
	portionPercent: number,
	pricePercent: number
): number {
	const portionFactor = clampPercent(portionPercent) / 100;
	const priceFactor = clampPercent(pricePercent) / 100;
	return Math.round(referencePriceSek * portionFactor * priceFactor);
}

export function normalizeSwedishMobileNumber(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) {
		return null;
	}

	const digits = trimmed.replace(/\D/g, '');
	let local: string | null = null;

	if (digits.startsWith('46') && digits.length === 11) {
		local = digits.slice(2);
	} else if (digits.length === 10 && digits.startsWith('07')) {
		local = digits.slice(1);
	} else if (digits.length === 9 && digits.startsWith('7')) {
		local = digits;
	}

	if (!local || local.length !== 9 || !local.startsWith('7')) {
		return null;
	}

	return `0${local}`;
}

export function resolveMarketItemPricing(
	input: MarketItemPricingInput
): MarketItemPricingFields {
	const pricingMode = input.pricingMode ?? 'free';
	const portionPercent = clampPercent(input.portionPercent ?? DEFAULT_PORTION_PERCENT);
	const portionNote = input.portionNote?.trim() || undefined;

	if (pricingMode === 'free') {
		return {
			pricingMode: 'free',
			...(portionPercent !== DEFAULT_PORTION_PERCENT ? { portionPercent } : {}),
			...(portionNote ? { portionNote } : {})
		};
	}

	if (pricingMode === 'fixed') {
		const askingPriceSek = normalizeWholeSek(input.askingPriceSek);
		return {
			pricingMode: 'fixed',
			portionPercent,
			...(portionNote ? { portionNote } : {}),
			...(askingPriceSek != null ? { askingPriceSek } : {})
		};
	}

	const referenceFromUnit =
		input.unitPrice != null && input.quantity != null
			? calculateReferencePriceSek(input.unitPrice, input.quantity)
			: null;
	const referencePriceSek = input.referencePriceSek ?? referenceFromUnit ?? undefined;
	const referencePriceSource =
		input.referencePriceSource ??
		(referencePriceSek != null ? (referenceFromUnit != null ? 'price_memory' : 'manual') : 'none');
	const pricePercent = clampPercent(input.pricePercent ?? DEFAULT_PORTION_PERCENT);

	if (referencePriceSek == null) {
		return {
			pricingMode: 'free',
			portionPercent,
			...(portionNote ? { portionNote } : {})
		};
	}

	const askingPriceSek = calculateAskingPriceSek(referencePriceSek, portionPercent, pricePercent);

	return {
		pricingMode: 'percent_of_reference',
		portionPercent,
		...(portionNote ? { portionNote } : {}),
		referencePriceSek,
		referencePriceSource,
		pricePercent,
		askingPriceSek
	};
}

export function applyPricingToItemSnapshot(
	base: ExpiringShareItemSnapshot,
	pricing: MarketItemPricingFields
): ExpiringShareItemSnapshot {
	if (pricing.pricingMode === 'free') {
		const next: ExpiringShareItemSnapshot = { ...base, pricingMode: 'free' };
		if (pricing.portionPercent != null && pricing.portionPercent !== DEFAULT_PORTION_PERCENT) {
			next.portionPercent = pricing.portionPercent;
		}
		if (pricing.portionNote) {
			next.portionNote = pricing.portionNote;
		}
		return next;
	}

	return {
		...base,
		...pricing
	};
}

export function resolveAutoListingItemPricing(input: {
	quantity: string;
	unitPrice?: string | null;
	defaultPricePercent?: number | null;
	portionPercent?: number;
	portionNote?: string;
}): MarketItemPricingFields {
	const defaultPercent = input.defaultPricePercent;
	if (defaultPercent == null || input.unitPrice == null) {
		return resolveMarketItemPricing({
			pricingMode: 'free',
			portionPercent: input.portionPercent,
			portionNote: input.portionNote,
			quantity: input.quantity,
			unitPrice: input.unitPrice
		});
	}

	return resolveMarketItemPricing({
		pricingMode: 'percent_of_reference',
		pricePercent: defaultPercent,
		portionPercent: input.portionPercent ?? DEFAULT_PORTION_PERCENT,
		portionNote: input.portionNote,
		quantity: input.quantity,
		unitPrice: input.unitPrice,
		referencePriceSource: 'price_memory'
	});
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) {
		return DEFAULT_PORTION_PERCENT;
	}
	return Math.min(100, Math.max(1, Math.round(value)));
}

function normalizeWholeSek(value: number | undefined): number | null {
	if (value == null || !Number.isFinite(value) || value < 0) {
		return null;
	}
	return Math.round(value);
}

export function shouldShowPickupPaymentCard(status: MarketLifecycleStatus): boolean {
	return status === 'pickup_agreed' || status === 'awaiting_handover';
}

export function hasPaidListingItems(items: ExpiringShareItemSnapshot[]): boolean {
	return items.some((item) => !isFreeListingItem(item) && (item.askingPriceSek ?? 0) > 0);
}

export function sumListingAskingPriceSek(items: ExpiringShareItemSnapshot[]): number {
	return items.reduce((sum, item) => {
		if (isFreeListingItem(item)) {
			return sum;
		}
		return sum + (item.askingPriceSek ?? 0);
	}, 0);
}

export function maskSwedishMobileNumber(normalized: string): string {
	if (normalized.length !== 10 || !normalized.startsWith('0')) {
		return '***';
	}
	return `${normalized.slice(0, 3)}-*** **${normalized.slice(-2)}`;
}

export function formatSwedishMobileForDisplay(normalized: string): string {
	if (normalized.length !== 10) {
		return normalized;
	}
	return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`;
}

function swishPayeeInternational(normalized: string): string {
	return `46${normalized.slice(1)}`;
}

function encodeSwishPaymentPayload(payload: object): string {
	const json = JSON.stringify(payload);
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(json, 'utf8').toString('base64');
	}
	return btoa(unescape(encodeURIComponent(json)));
}

export function buildSwishPaymentUrl(input: {
	swishNumber: string;
	amountSek: number;
	message?: string;
}): string | null {
	const normalized = normalizeSwedishMobileNumber(input.swishNumber);
	if (!normalized || input.amountSek <= 0) {
		return null;
	}

	const message = (input.message ?? '').trim().slice(0, 50);
	const payload = {
		version: 1,
		payee: {
			value: swishPayeeInternational(normalized),
			editable: false
		},
		amount: {
			value: Math.round(input.amountSek),
			editable: false
		},
		...(message
			? {
					message: {
						value: message,
						editable: true
					}
				}
			: {})
	};

	return `swish://payment?data=${encodeURIComponent(encodeSwishPaymentPayload(payload))}`;
}
