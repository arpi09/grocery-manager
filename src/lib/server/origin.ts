import { env } from '$env/dynamic/private';

const DEFAULT_DEV_ORIGIN = 'http://localhost:5173';

/** Canonical app origin for absolute URLs (emails, redirects). Prefers ORIGIN over PUBLIC_ORIGIN. */
export function getAppOrigin(fallback?: string): string {
	const candidates = [
		env.ORIGIN,
		env.PUBLIC_ORIGIN,
		process.env.ORIGIN,
		process.env.PUBLIC_ORIGIN,
		fallback,
		DEFAULT_DEV_ORIGIN
	];

	for (const candidate of candidates) {
		const trimmed = candidate?.trim();
		if (trimmed) {
			return trimmed.replace(/\/$/, '');
		}
	}

	return DEFAULT_DEV_ORIGIN;
}
