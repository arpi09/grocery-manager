import { resolveAppOrigin } from '$lib/marketing/app-url';

/** Hostnames that must 301 to PUBLIC_ORIGIN apex (legacy Firebase + www). */
const REDIRECT_HOSTNAMES = new Set([
	'home-pantry--home-pantry-4bee5.europe-west4.hosted.app',
	'www.skaffu.com'
]);

/**
 * Returns absolute redirect URL when request host is legacy/www; otherwise null.
 * Preserves pathname and query string; target origin comes from PUBLIC_ORIGIN.
 */
export function resolveCanonicalHostRedirect(url: URL): string | null {
	const hostname = url.hostname.toLowerCase();
	if (!REDIRECT_HOSTNAMES.has(hostname)) {
		return null;
	}

	const canonicalOrigin = resolveAppOrigin();
	const canonicalHost = new URL(canonicalOrigin).hostname.toLowerCase();
	if (hostname === canonicalHost) {
		return null;
	}

	return `${canonicalOrigin}${url.pathname}${url.search}`;
}
