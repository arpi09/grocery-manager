import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';
import { EXPIRING_SHARE_TTL_MS } from '$lib/domain/expiring-share';
import { coarseGeoCoordinate, type GeoCoordinate } from '$lib/domain/geo';

/** Stable prefix — all demo rows use these ids for one-click cleanup. */
export const MARKET_DEMO_USER_PREFIX = 'market-demo-user-';
export const MARKET_DEMO_HOUSEHOLD_PREFIX = 'market-demo-hh-';
export const MARKET_DEMO_SHARE_PREFIX = 'market-demo-share-';

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
					unit: 'dl'
				},
				{
					name: 'Färskost',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'förp'
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
					unit: 'st'
				},
				{
					name: 'Mjölk',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'l'
				},
				{
					name: 'Yoghurt',
					expiresOn: expiresOnDaysFromNow(3),
					location: 'fridge',
					quantity: '2',
					unit: 'st'
				}
			]
		},
		{
			slot: 3,
			sharerFirstName: 'Sara',
			offsetM: 350,
			bearingDeg: 290,
			items: [
				{
					name: 'Lasagne',
					expiresOn: expiresOnDaysFromNow(2),
					location: 'fridge',
					quantity: '1',
					unit: 'förp'
				},
				{
					name: 'Sallad',
					expiresOn: expiresOnDaysFromNow(1),
					location: 'fridge',
					quantity: '1',
					unit: 'påse'
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
			items: template.items
		};
	});
}

export function marketDemoShareExpiresAt(): Date {
	return new Date(Date.now() + EXPIRING_SHARE_TTL_MS);
}

export function isMarketDemoSeedEnabled(readEnv: () => string | undefined = () => undefined): boolean {
	const value = readEnv()?.trim().toLowerCase();
	if (value === 'false' || value === '0') {
		return false;
	}
	return true;
}
