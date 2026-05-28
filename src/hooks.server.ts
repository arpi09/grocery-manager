import { initDatabase } from '$lib/infrastructure/db';
import {
	adminService,
	authService,
	inventoryService,
	mealPlanService,
	petFoodService,
	petService
} from '$lib/server/di';
import { isAdmin } from '$lib/server/auth';
import { validateSession } from '$lib/server/session';
import { redirect, type Handle } from '@sveltejs/kit';

const publicPaths = new Set(['/login', '/register']);

export const handle: Handle = async ({ event, resolve }) => {
	await initDatabase();

	event.locals.authService = authService;
	event.locals.adminService = adminService;
	event.locals.inventoryService = inventoryService;
	event.locals.mealPlanService = mealPlanService;
	event.locals.petService = petService;
	event.locals.petFoodService = petFoodService;

	await validateSession(event);

	const { pathname } = event.url;
	const isPublic = publicPaths.has(pathname);
	const isAuthenticated = !!event.locals.user;

	if (!isAuthenticated && !isPublic) {
		redirect(302, '/login');
	}

	if (isAuthenticated && isPublic) {
		redirect(302, '/');
	}

	if (pathname.startsWith('/admin') && isAuthenticated && !isAdmin(event.locals.user)) {
		redirect(302, '/');
	}

	return resolve(event);
};
