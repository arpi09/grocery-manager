import { initDatabase } from '$lib/infrastructure/db';
import {
	adminService,
	authService,
	profileService,
	householdService,
	inventoryService,
	shoppingListService,
	mealPlanService,
	petFoodService,
	petService
} from '$lib/server/di';
import { recordUserActivity } from '$lib/server/activity';
import { resolveHouseholdId } from '$lib/server/household-context';
import { isAdmin } from '$lib/server/auth';
import { validateSession } from '$lib/server/session';
import { recordAppError } from '$lib/server/error-log/record';
import { shouldPersistServerError } from '$lib/server/error-log/should-log';
import { isThemePreference, prefersDarkFromRequest, resolveTheme } from '$lib/domain/theme';
import { writeThemeCookie } from '$lib/infrastructure/theme-cookie';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

const publicPaths = new Set(['/login', '/register']);

function isInvitePath(pathname: string): boolean {
	return pathname.startsWith('/invite/');
}

export const handle: Handle = async ({ event, resolve }) => {
	await initDatabase();

	event.locals.authService = authService;
	event.locals.profileService = profileService;
	event.locals.adminService = adminService;
	event.locals.householdService = householdService;
	event.locals.householdId = null;
	event.locals.householdRole = null;
	event.locals.inventoryService = inventoryService;
	event.locals.shoppingListService = shoppingListService;
	event.locals.mealPlanService = mealPlanService;
	event.locals.petService = petService;
	event.locals.petFoodService = petFoodService;

	await validateSession(event);

	if (event.locals.user) {
		await recordUserActivity(event.locals.user.id);
		event.locals.householdId = await resolveHouseholdId(
			event.locals.householdService,
			event.locals.user.id
		);
		if (event.locals.householdId) {
			event.locals.householdRole = await event.locals.householdService.getRoleForUser(
				event.locals.householdId,
				event.locals.user.id
			);
		}
	}

	const { pathname } = event.url;
	const isPublic = publicPaths.has(pathname) || isInvitePath(pathname);
	const isAuthenticated = !!event.locals.user;

	if (!isAuthenticated && !isPublic) {
		redirect(302, '/login');
	}

	if (isAuthenticated && isPublic && !isInvitePath(pathname)) {
		redirect(302, '/');
	}

	if (pathname.startsWith('/admin') && isAuthenticated && !isAdmin(event.locals.user)) {
		redirect(302, '/');
	}

	let resolvedTheme: 'light' | 'dark' = 'light';

	if (isAuthenticated) {
		const rawPreference = event.locals.user!.themePreference;
		const preference =
			rawPreference && isThemePreference(rawPreference) ? rawPreference : 'system';
		writeThemeCookie(event.cookies, preference);
		resolvedTheme = resolveTheme(preference, prefersDarkFromRequest(event.request));
	}

	return resolve(event, {
		transformPageChunk: ({ html, done }) => {
			if (!done) {
				return html;
			}
			return html.replaceAll('%pantry.resolvedTheme%', resolvedTheme);
		}
	});
};

export const handleError: HandleServerError = async ({ error, event, status }) => {
	if (shouldPersistServerError(error, status)) {
		await recordAppError({
			error,
			path: `${event.request.method} ${event.url.pathname}`,
			userId: event.locals.user?.id ?? null,
			statusCode: status
		});
	}

	return {
		message: status >= 500 ? 'Ett ovÃ¤ntat fel intrÃ¤ffade.' : 'NÃ¥got gick fel.'
	};
};
