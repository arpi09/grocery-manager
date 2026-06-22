import { describe, expect, it } from 'vitest';
import {
	applyPricingToItemSnapshot,
	buildSwishPaymentUrl,
	calculateAskingPriceSek,
	calculateReferencePriceSek,
	hasPaidListingItems,
	isFreeListingItem,
	maskSwedishMobileNumber,
	normalizeSwedishMobileNumber,
	parseListingQuantity,
	resolveAutoListingItemPricing,
	resolveMarketItemPricing,
	shouldShowPickupPaymentCard,
	sumListingAskingPriceSek
} from './market-pricing';

describe('market-pricing', () => {
	it('treats missing pricingMode as free', () => {
		expect(isFreeListingItem({})).toBe(true);
		expect(isFreeListingItem({ pricingMode: 'free' })).toBe(true);
		expect(isFreeListingItem({ pricingMode: 'fixed', askingPriceSek: 25 })).toBe(false);
	});

	it('parses listing quantities', () => {
		expect(parseListingQuantity('400')).toBe(400);
		expect(parseListingQuantity('1,5')).toBe(1.5);
		expect(parseListingQuantity('')).toBe(1);
		expect(parseListingQuantity('0')).toBe(1);
	});

	it('calculates reference price from unit price and quantity', () => {
		expect(calculateReferencePriceSek('25', '2')).toBe(50);
		expect(calculateReferencePriceSek('12.5', 1)).toBe(12.5);
		expect(calculateReferencePriceSek('0', '1')).toBeNull();
	});

	it('calculates asking price from reference, portion and price percent', () => {
		expect(calculateAskingPriceSek(50, 75, 50)).toBe(19);
		expect(calculateAskingPriceSek(100, 100, 50)).toBe(50);
	});

	it('defaults to free pricing mode', () => {
		expect(resolveMarketItemPricing({})).toEqual({ pricingMode: 'free' });
	});

	it('resolves percent_of_reference pricing', () => {
		const pricing = resolveMarketItemPricing({
			pricingMode: 'percent_of_reference',
			unitPrice: '50',
			quantity: '1',
			portionPercent: 75,
			pricePercent: 50,
			referencePriceSource: 'price_memory'
		});

		expect(pricing).toEqual({
			pricingMode: 'percent_of_reference',
			portionPercent: 75,
			referencePriceSek: 50,
			referencePriceSource: 'price_memory',
			pricePercent: 50,
			askingPriceSek: 19
		});
	});

	it('falls back to free when reference price is missing', () => {
		expect(
			resolveMarketItemPricing({
				pricingMode: 'percent_of_reference',
				pricePercent: 50
			})
		).toEqual({ pricingMode: 'free', portionPercent: 100 });
	});

	it('resolves fixed pricing', () => {
		expect(
			resolveMarketItemPricing({
				pricingMode: 'fixed',
				askingPriceSek: 35.4,
				portionNote: ' Halv förpackning '
			})
		).toEqual({
			pricingMode: 'fixed',
			portionPercent: 100,
			portionNote: 'Halv förpackning',
			askingPriceSek: 35
		});
	});

	it('auto listing uses user default percent when price memory exists', () => {
		expect(
			resolveAutoListingItemPricing({
				quantity: '1',
				unitPrice: '50',
				defaultPricePercent: 50
			})
		).toMatchObject({
			pricingMode: 'percent_of_reference',
			referencePriceSek: 50,
			pricePercent: 50,
			askingPriceSek: 25
		});
	});

	it('auto listing stays free without default percent or price memory', () => {
		expect(
			resolveAutoListingItemPricing({
				quantity: '1',
				defaultPricePercent: 50
			})
		).toEqual({ pricingMode: 'free' });

		expect(
			resolveAutoListingItemPricing({
				quantity: '1',
				unitPrice: '50'
			})
		).toEqual({ pricingMode: 'free' });
	});

	it('applies pricing fields onto snapshot items', () => {
		const base = {
			name: 'Mjölk',
			expiresOn: '2026-06-24',
			location: 'fridge' as const,
			quantity: '1',
			unit: 'l'
		};

		expect(
			applyPricingToItemSnapshot(
				base,
				resolveMarketItemPricing({
					pricingMode: 'percent_of_reference',
					unitPrice: '20',
					quantity: '1',
					pricePercent: 50
				})
			)
		).toMatchObject({
			name: 'Mjölk',
			pricingMode: 'percent_of_reference',
			askingPriceSek: 10
		});
	});

	it('normalizes Swedish mobile numbers', () => {
		expect(normalizeSwedishMobileNumber('070-123 45 67')).toBe('0701234567');
		expect(normalizeSwedishMobileNumber('+46 70 123 45 67')).toBe('0701234567');
		expect(normalizeSwedishMobileNumber('701234567')).toBe('0701234567');
		expect(normalizeSwedishMobileNumber('123')).toBeNull();
		expect(normalizeSwedishMobileNumber('')).toBeNull();
	});

	it('masks and sums listing prices for pickup card', () => {
		expect(maskSwedishMobileNumber('0701234567')).toBe('070-*** **67');
		expect(shouldShowPickupPaymentCard('pickup_agreed')).toBe(true);
		expect(shouldShowPickupPaymentCard('chatting')).toBe(false);
		expect(
			hasPaidListingItems([
				{
					name: 'Mjölk',
					expiresOn: null,
					location: 'fridge',
					quantity: '1',
					unit: 'l',
					pricingMode: 'percent_of_reference',
					askingPriceSek: 15
				}
			])
		).toBe(true);
		expect(
			sumListingAskingPriceSek([
				{
					name: 'Mjölk',
					expiresOn: null,
					location: 'fridge',
					quantity: '1',
					unit: 'l',
					pricingMode: 'percent_of_reference',
					askingPriceSek: 15
				},
				{
					name: 'Bröd',
					expiresOn: null,
					location: 'cupboard',
					quantity: '1',
					unit: 'st',
					pricingMode: 'free'
				}
			])
		).toBe(15);
	});

	it('builds swish payment deep links', () => {
		const url = buildSwishPaymentUrl({
			swishNumber: '070-123 45 67',
			amountSek: 25,
			message: 'Grannskafferiet'
		});
		expect(url).toMatch(/^swish:\/\/payment\?data=/);
		expect(buildSwishPaymentUrl({ swishNumber: 'invalid', amountSek: 10 })).toBeNull();
	});
});
