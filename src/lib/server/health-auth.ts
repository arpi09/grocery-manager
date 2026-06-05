import { env } from '$env/dynamic/private';

/** Authorize internal health probes (Bearer HEALTH_SECRET or CRON_SECRET). */
export function isHealthAuthorized(request: Request): boolean {
	const secret = env.HEALTH_SECRET?.trim() || env.CRON_SECRET?.trim();
	if (!secret) {
		return false;
	}

	const header = request.headers.get('authorization');
	return header === `Bearer ${secret}`;
}
