import { isHttpError, isRedirect } from '@sveltejs/kit';

export function shouldPersistServerError(error: unknown, status: number): boolean {
	if (isRedirect(error)) {
		return false;
	}
	if (isHttpError(error) && status < 500) {
		return false;
	}
	return status >= 500;
}
