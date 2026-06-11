export interface PilotCityBounds {
	minLat: number;
	maxLat: number;
	minLng: number;
	maxLng: number;
}

export interface PilotCity {
	slug: PilotCitySlug;
	labelSv: string;
	labelEn: string;
	bounds: PilotCityBounds;
}

export type PilotCitySlug = 'malmo' | 'stockholm' | 'goteborg';

export const PILOT_CITIES = [
	{
		slug: 'malmo',
		labelSv: 'Malmö',
		labelEn: 'Malmö',
		bounds: {
			minLat: 55.45,
			maxLat: 55.75,
			minLng: 12.8,
			maxLng: 13.25
		}
	},
	{
		slug: 'stockholm',
		labelSv: 'Stockholm',
		labelEn: 'Stockholm',
		bounds: {
			minLat: 59.15,
			maxLat: 59.51,
			minLng: 17.75,
			maxLng: 18.39
		}
	},
	{
		slug: 'goteborg',
		labelSv: 'Göteborg',
		labelEn: 'Gothenburg',
		bounds: {
			minLat: 57.55,
			maxLat: 57.87,
			minLng: 11.7,
			maxLng: 12.25
		}
	}
] as const satisfies readonly PilotCity[];

export const DEFAULT_PILOT_CITY_SLUG: PilotCitySlug = 'malmo';

export function listPilotCities(): PilotCity[] {
	return [...PILOT_CITIES];
}

function isPilotCitySlug(value: string): value is PilotCitySlug {
	return PILOT_CITIES.some((city) => city.slug === value);
}

export function resolvePilotCity(slug: string | null | undefined): PilotCity | null {
	if (!slug) {
		return null;
	}

	const normalized = slug.trim().toLowerCase();
	if (!isPilotCitySlug(normalized)) {
		return null;
	}

	return PILOT_CITIES.find((city) => city.slug === normalized) ?? null;
}

export function getDefaultPilotCity(): PilotCity {
	return PILOT_CITIES.find((city) => city.slug === DEFAULT_PILOT_CITY_SLUG)!;
}
