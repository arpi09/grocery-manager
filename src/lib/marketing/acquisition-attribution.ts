import { resolveAppOrigin } from './app-url';
import { appendSearchParamsToAppPath } from './utm-params';

export const ACQUISITION_SOURCES = [
	'shopping_share',
	'city_feed',
	'expiring_share',
	'household_invite_inkop'
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

const ACQUISITION_UTM = {
	utm_source: 'skaffu',
	utm_medium: 'product',
	utm_campaign: 'acquisition_wedge'
} as const;

function trimOrigin(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed.replace(/\/$/, '') : undefined;
}

function buildAcquisitionSearchParams(source: AcquisitionSource): URLSearchParams {
	const params = new URLSearchParams();
	params.set('utm_source', ACQUISITION_UTM.utm_source);
	params.set('utm_medium', ACQUISITION_UTM.utm_medium);
	params.set('utm_campaign', ACQUISITION_UTM.utm_campaign);
	params.set('utm_content', source);
	return params;
}

function isSameOriginRequest(requestOrigin: string | undefined, resolvedOrigin: string): boolean {
	return !!requestOrigin && resolvedOrigin === trimOrigin(requestOrigin);
}

/** Register URL with acquisition wedge UTM params for signup attribution. */
export function buildAcquisitionRegisterUrl(
	source: AcquisitionSource,
	requestOrigin?: string
): string {
	const origin = resolveAppOrigin(requestOrigin);
	const path = appendSearchParamsToAppPath('/register', buildAcquisitionSearchParams(source));

	if (isSameOriginRequest(requestOrigin, origin)) {
		return path;
	}

	return `${origin}${path}`;
}

/** Marketing home URL with acquisition wedge UTM params for logged-out CTAs. */
export function buildAcquisitionLandingUrl(
	source: AcquisitionSource,
	requestOrigin?: string
): string {
	const origin = resolveAppOrigin(requestOrigin);
	const path = appendSearchParamsToAppPath('/', buildAcquisitionSearchParams(source));

	if (isSameOriginRequest(requestOrigin, origin)) {
		return path;
	}

	return `${origin}${path}`;
}
