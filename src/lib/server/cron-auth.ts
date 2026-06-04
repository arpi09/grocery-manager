import { env } from '$env/dynamic/private';

export function isCronAuthorized(request: Request): boolean {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		return false;
	}

	const header = request.headers.get('authorization');
	return header === `Bearer ${secret}`;
}
