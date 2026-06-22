import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';
import { EXPIRING_SHARE_TTL_MS } from '$lib/domain/expiring-share';
import { coarseGeoCoordinate, type GeoCoordinate } from '$lib/domain/geo';
import type { MarketItemsAsDescribed } from '$lib/domain/market-lifecycle';
/** Stable prefix — all demo rows use these ids for one-click cleanup. */
export const MARKET_DEMO_USER_PREFIX = 'market-demo-user-';
export const MARKET_DEMO_HOUSEHOLD_PREFIX = 'market-demo-hh-';
export const MARKET_DEMO_SHARE_PREFIX = 'market-demo-share-';
export const MARKET_DEMO_THREAD_PREFIX = 'market-demo-thread-';

export const MARKET_DEMO_SOURCE = 'demo_market' as const;

/** Stockholm centre — fallback when admin has no nearby coords yet. */
export const MARKET_DEMO_DEFAULT_CENTER: GeoCoordinate = {
	latitude: 59.329,
	longitude: 18.068
};

export interface MarketDemoListingFixture {
	slot: number;
	householdId: string;
	userId: string;
	shareId: string;
	sharerFirstName: string;
	email: string;
	latitude: number;
	longitude: number;
	items: ExpiringShareItemSnapshot[];
	marketSwishNumber?: string | null;
}

function expiresOnDaysFromNow(days: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

function offsetCoordinate(center: GeoCoordinate, distanceM: number, bearingDeg: number): GeoCoordinate {
	const bearing = (bearingDeg * Math.PI) / 180;
	const latScale = 111_320;
	const lngScale = 111_320 * Math.max(0.01, Math.abs(Math.cos((center.latitude * Math.PI) / 180)));
	return coarseGeoCoordinate({
		latitude: center.latitude + (distanceM * Math.cos(bearing)) / latScale,
		longitude: center.longitude + (distanceM * Math.sin(bearing)) / lngScale
	});
}

export function marketDemoListingFixtures(center: GeoCoordinate): MarketDemoListingFixture[] {
	const templates: Array<{
		slot: number;
		sharerFirstName: string;
		offsetM: number;
		bearingDeg: number;
		marketSwishNumber?: string;
		items: ExpiringShareItemSnapshot[];
	}> = [
		{
			slot: 1,
			sharerFirstName: 'Anna',
			offsetM: 180,
			bearingDeg: 45,
			items: [
				{
					name: 'Gräddfil',
					expiresOn: expiresOnDaysFromNow(1),
					location: 'fridge',
					quantity: '2',
					unit: 'dl',
					pricingMode: 'percent_of_reference',
					referencePriceSek: 50,
					referencePriceSource: 'price_memory',
					portionPercent: 75,
					pricePercent: 50,
					askingPriceSek: 25
				},
				{
					name: 'Färskost',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'förp',
					pricingMode: 'free'
				}
			]
		},
		{
			slot: 2,
			sharerFirstName: 'Erik',
			offsetM: 280,
			bearingDeg: 160,
			items: [
				{
					name: 'Bananer',
					expiresOn: expiresOnDaysFromNow(1),
					location: 'cupboard',
					quantity: '4',
					unit: 'st',
					pricingMode: 'free',
					portionPercent: 100
				},
				{
					name: 'Mjölk',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'l',
					pricingMode: 'free'
				},
				{
					name: 'Yoghurt',
					expiresOn: expiresOnDaysFromNow(3),
					location: 'fridge',
					quantity: '2',
					unit: 'st',
					pricingMode: 'free'
				}
			]
		},
		{
			slot: 3,
			sharerFirstName: 'Lisa',
			offsetM: 350,
			bearingDeg: 290,
			marketSwishNumber: '0701234567',
			items: [
				{
					name: 'Lasagne',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'förp',
					pricingMode: 'percent_of_reference',
					referencePriceSek: 30,
					referencePriceSource: 'price_memory',
					portionPercent: 50,
					pricePercent: 100,
					askingPriceSek: 15
				},
				{
					name: 'Sallad',
					expiresOn: expiresOnDaysFromNow(1),
					location: 'fridge',
					quantity: '1',
					unit: 'påse',
					pricingMode: 'free'
				}
			]
		},
		{
			slot: 4,
			sharerFirstName: 'Sara',
			offsetM: 420,
			bearingDeg: 75,
			items: [
				{
					name: 'Bröd',
					expiresOn: expiresOnDaysFromNow(1),
					location: 'cupboard',
					quantity: '1',
					unit: 'limpa'
				},
				{
					name: 'Ost',
					expiresOn: expiresOnDaysFromNow(3),
					location: 'fridge',
					quantity: '200',
					unit: 'g'
				}
			]
		}
	];

	return templates.map((template) => {
		const idSuffix = String(template.slot);
		const coord = offsetCoordinate(center, template.offsetM, template.bearingDeg);
		return {
			slot: template.slot,
			householdId: `${MARKET_DEMO_HOUSEHOLD_PREFIX}${idSuffix}`,
			userId: `${MARKET_DEMO_USER_PREFIX}${idSuffix}`,
			shareId: `${MARKET_DEMO_SHARE_PREFIX}${idSuffix}`,
			sharerFirstName: template.sharerFirstName,
			email: `market-demo-${idSuffix}@demo.skaffu.internal`,
			latitude: coord.latitude,
			longitude: coord.longitude,
			items: template.items,
			...(template.marketSwishNumber ? { marketSwishNumber: template.marketSwishNumber } : {})
		};
	});
}

export function marketDemoShareExpiresAt(): Date {
	return new Date(Date.now() + EXPIRING_SHARE_TTL_MS);
}

export interface MarketDemoChatFixture {
	threadId: string;
	shareId: string;
	sharerUserId: string;
	householdId: string;
	messages: Array<{ author: 'admin' | 'sharer'; body: string; offsetMinutes: number }>;
	lifecycleStatus?: 'pickup_agreed' | 'completed' | 'reported';
	reportReason?: 'inappropriate' | 'no_show' | 'misleading' | 'unsafe' | 'other';
	adminRating?: {
		stars: number;
		comment?: string;
		itemsAsDescribed?: MarketItemsAsDescribed;
	};
	sharerRating?: {
		stars: number;
		comment?: string;
		itemsAsDescribed?: MarketItemsAsDescribed;
	};
}

export function marketDemoChatFixtures(
	adminUserId: string,
	listings: MarketDemoListingFixture[]
): MarketDemoChatFixture[] {
	const anna = listings.find((listing) => listing.slot === 1);
	const erik = listings.find((listing) => listing.slot === 2);
	const lisa = listings.find((listing) => listing.slot === 3);
	const sara = listings.find((listing) => listing.slot === 4);
	if (!anna) {
		return [];
	}

	const fixtures: MarketDemoChatFixture[] = [
		{
			threadId: `${MARKET_DEMO_THREAD_PREFIX}1`,
			shareId: anna.shareId,
			sharerUserId: anna.userId,
			householdId: anna.householdId,
			lifecycleStatus: 'pickup_agreed',
			messages: [
				{ author: 'admin', body: 'Hej! Är gräddfilen fortfarande tillgänglig?', offsetMinutes: -180 },
				{ author: 'sharer', body: 'Hej! Ja, den står klar i kylen.', offsetMinutes: -150 },
				{ author: 'admin', body: 'Perfekt — kan jag hämta i kväll?', offsetMinutes: -120 }
			]
		}
	];

	if (erik) {
		fixtures.push({
			threadId: `${MARKET_DEMO_THREAD_PREFIX}2`,
			shareId: erik.shareId,
			sharerUserId: erik.userId,
			householdId: erik.householdId,
			lifecycleStatus: 'completed',
			messages: [
				{ author: 'admin', body: 'Hej Erik! Intresserad av bananerna.', offsetMinutes: -90 },
				{ author: 'sharer', body: 'Kul! Hör av dig när du är på väg.', offsetMinutes: -60 }
			]
		});
	}

	if (lisa) {
		fixtures.push({
			threadId: `${MARKET_DEMO_THREAD_PREFIX}3`,
			shareId: lisa.shareId,
			sharerUserId: lisa.userId,
			householdId: lisa.householdId,
			lifecycleStatus: 'pickup_agreed',
			messages: [
				{ author: 'admin', body: 'Hej Lisa! Är lasagnen fortfarande kvar?', offsetMinutes: -240 },
				{ author: 'sharer', body: 'Ja — ca halva förpackningen kvar, 15 kr vid hämtning.', offsetMinutes: -210 },
				{ author: 'admin', body: 'Toppen, vi ses i kväll!', offsetMinutes: -180 }
			]
		});
	}

	if (sara) {
		fixtures.push({
			threadId: `${MARKET_DEMO_THREAD_PREFIX}4`,
			shareId: sara.shareId,
			sharerUserId: sara.userId,
			householdId: sara.householdId,
			lifecycleStatus: 'reported',
			reportReason: 'unsafe',
			messages: [
				{ author: 'admin', body: 'Hej Sara! Kan jag hämta brödet i kväll?', offsetMinutes: -300 },
				{ author: 'sharer', body: 'Visst, kom förbi efter 18.', offsetMinutes: -270 },
				{ author: 'admin', body: 'Tack, jag är på väg nu.', offsetMinutes: -60 }
			]
		});
	}

	return fixtures;
}

export function isMarketDemoSeedEnabled(readEnv: () => string | undefined = () => undefined): boolean {
	const value = readEnv()?.trim().toLowerCase();
	if (value === 'false' || value === '0') {
		return false;
	}
	return true;
}
