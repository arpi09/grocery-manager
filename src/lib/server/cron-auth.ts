import { env } from '$env/dynamic/private';

export function isCronAuthorized(request: Request): boolean {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		return false;
	}

	const header = request.headers.get('authorization');
	if (header === `Bearer ${secret}`) {
		return true;
	}

	const url = new URL(request.url);
	return url.searchParams.get('secret') === secret;
}
