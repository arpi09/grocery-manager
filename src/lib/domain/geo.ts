/** Approximate radius for Grannskafferiet v1 nearby discovery. */
export const NEARBY_SHARING_RADIUS_M = 500;

/** Max offset for map display pins (jitter within coarse cell). */
export const DISPLAY_JITTER_RADIUS_M = 75;

/** Decimal places for stored coordinates (~111 m per step at equator). */
export const COARSE_GEO_DECIMALS = 3;

export interface GeoCoordinate {
	latitude: number;
	longitude: number;
}

export function coarseGeoCoordinate(coord: GeoCoordinate): GeoCoordinate {
	const factor = 10 ** COARSE_GEO_DECIMALS;
	return {
		latitude: Math.round(coord.latitude * factor) / factor,
		longitude: Math.round(coord.longitude * factor) / factor
	};
}

export function isValidLatitude(value: number): boolean {
	return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
	return Number.isFinite(value) && value >= -180 && value <= 180;
}

/** Haversine distance in metres between two WGS-84 points. */
export function distanceMetres(a: GeoCoordinate, b: GeoCoordinate): number {
	const earthRadiusM = 6_371_000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.latitude - a.latitude);
	const dLng = toRad(b.longitude - a.longitude);
	const lat1 = toRad(a.latitude);
	const lat2 = toRad(b.latitude);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * earthRadiusM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Bounding box for SQL pre-filter (metres). */
export function geoBoundingBox(
	center: GeoCoordinate,
	radiusM: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
	const latDelta = radiusM / 111_320;
	const lngScale = Math.cos((center.latitude * Math.PI) / 180);
	const lngDelta = radiusM / (111_320 * Math.max(0.01, Math.abs(lngScale)));
	return {
		minLat: center.latitude - latDelta,
		maxLat: center.latitude + latDelta,
		minLng: center.longitude - lngDelta,
		maxLng: center.longitude + lngDelta
	};
}

/** Round to nearest 100 m for privacy-friendly distance labels. */
export function approximateDistanceMetres(distanceM: number): number {
	return Math.max(100, Math.round(distanceM / 100) * 100);
}

/** Deterministic unit float in [0, 1) from a stable id + salt. */
export function hashIdToUnitFloat(id: string, salt: string): number {
	let hash = 2_166_136_261;
	const input = `${id}:${salt}`;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16_777_619);
	}
	return (hash >>> 0) / 4_294_967_296;
}

/**
 * Offset a coarse coordinate for map display — deterministic per share id,
 * never exposes the sharer's exact stored position.
 */
export function jitterCoordinateForDisplay(
	id: string,
	coarseCoord: GeoCoordinate,
	radiusM = DISPLAY_JITTER_RADIUS_M
): GeoCoordinate {
	const angle = hashIdToUnitFloat(id, 'angle') * 2 * Math.PI;
	const distance = hashIdToUnitFloat(id, 'distance') * radiusM;
	const latScale = 111_320;
	const lngScale = 111_320 * Math.max(0.01, Math.abs(Math.cos((coarseCoord.latitude * Math.PI) / 180)));
	return {
		latitude: coarseCoord.latitude + (distance * Math.cos(angle)) / latScale,
		longitude: coarseCoord.longitude + (distance * Math.sin(angle)) / lngScale
	};
}
