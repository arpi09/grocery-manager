import { invalidateSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	await invalidateSession(event);
	redirect(302, '/login');
};
