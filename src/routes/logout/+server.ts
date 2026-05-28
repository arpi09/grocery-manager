import { clearThemeCookie } from '$lib/infrastructure/theme-cookie';
import { invalidateSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	await invalidateSession(event);
	clearThemeCookie(event.cookies);
	event.locals.user = null;
	event.locals.session = null;
	redirect(302, '/login');
};
