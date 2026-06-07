import type { SignupUtm } from '$lib/domain/signup-utm';
import { SIGNUP_UTM_MAX_LENGTH } from '$lib/domain/signup-utm';
import { pickUtmSearchParams } from './utm-params';

/** Cookie holding last-seen signup UTM query (30 days). */
export const SIGNUP_UTM_COOKIE = 'hp_signup_utm';

export const SIGNUP_UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const STORE_PARAM_KEYS = [
	['utm_source', 'source'],
	['utm_medium', 'medium'],
	['utm_campaign', 'campaign'],
	['utm_content', 'content']
] as const;

function sanitizeUtmValue(value: string | null): string | undefined {
	const trimmed = value?.trim();
	if (!trimmed) {
		return undefined;
	}
	return trimmed.slice(0, SIGNUP_UTM_MAX_LENGTH);
}

/** Parses stored signup UTM keys from URL search params. */
export function parseSignupUtmFromSearchParams(searchParams: URLSearchParams): SignupUtm | null {
	const picked = pickUtmSearchParams(searchParams);
	const utm: SignupUtm = {};

	for (const [paramKey, field] of STORE_PARAM_KEYS) {
		const value = sanitizeUtmValue(picked.get(paramKey));
		if (value) {
			utm[field] = value;
		}
	}

	return hasSignupUtm(utm) ? utm : null;
}

export function hasSignupUtm(utm: SignupUtm | null | undefined): utm is SignupUtm {
	if (!utm) {
		return false;
	}
	return Boolean(utm.source ?? utm.medium ?? utm.campaign ?? utm.content);
}

/** Serializes signup UTM for the attribution cookie. */
export function serializeSignupUtmCookie(utm: SignupUtm): string {
	const params = new URLSearchParams();
	for (const [paramKey, field] of STORE_PARAM_KEYS) {
		const value = utm[field];
		if (value) {
			params.set(paramKey, value);
		}
	}
	return params.toString();
}

export function parseSignupUtmCookie(cookieValue: string | undefined | null): SignupUtm | null {
	if (!cookieValue?.trim()) {
		return null;
	}
	return parseSignupUtmFromSearchParams(new URLSearchParams(cookieValue));
}

/** Query wins per field; falls back to cookie when URL omits a key. */
/** Maps resolved signup UTM to product_event metadata keys. */
export function signupUtmToEventMetadata(
	utm: SignupUtm | null | undefined
): Record<string, string> {
	if (!hasSignupUtm(utm)) {
		return {};
	}

	const metadata: Record<string, string> = {};
	if (utm.source) {
		metadata.utm_source = utm.source;
	}
	if (utm.medium) {
		metadata.utm_medium = utm.medium;
	}
	if (utm.campaign) {
		metadata.utm_campaign = utm.campaign;
	}
	if (utm.content) {
		metadata.utm_content = utm.content;
	}
	return metadata;
}

export function resolveSignupUtm(input: {
	searchParams: URLSearchParams;
	cookieValue?: string | null;
}): SignupUtm | null {
	const fromUrl = parseSignupUtmFromSearchParams(input.searchParams);
	const fromCookie = parseSignupUtmCookie(input.cookieValue);

	if (!fromUrl && !fromCookie) {
		return null;
	}
	if (!fromUrl) {
		return fromCookie;
	}
	if (!fromCookie) {
		return fromUrl;
	}

	return {
		source: fromUrl.source ?? fromCookie.source,
		medium: fromUrl.medium ?? fromCookie.medium,
		campaign: fromUrl.campaign ?? fromCookie.campaign,
		content: fromUrl.content ?? fromCookie.content
	};
}
