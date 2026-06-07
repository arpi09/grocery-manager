import { initDatabase } from '$lib/infrastructure/db';
import { shouldRedirectUnverifiedUser } from '$lib/server/email-verification-enforcement';
import {
	adminService,
	authService,
	passwordResetService,
	emailVerificationService,
	oauthService,
	profileService,
	householdService,
	inventoryService,
	statistikService,
	gamificationService,
	wrappedService,
	shoppingListService,
	mealPlanService,
	weeklyRitualService,
	petFoodService,
	petService,
	pmfService,
	productFeedbackService,
	pmfSurveyService,
	aiRateLimitService,
	aiUsageAdminService,
	planLimitsService,
	waitlistService,
	billingService,
	purchasePatternService
} from '$lib/server/di';
import { recordUserActivity } from '$lib/server/activity';
import { resolveHouseholdId } from '$lib/server/household-context';
import { isAdmin } from '$lib/server/auth';
import { validateSession } from '$lib/server/session';
import { recordAppError } from '$lib/server/error-log/record';
import { shouldPersistServerError } from '$lib/server/error-log/should-log';
import { isThemePreference, prefersDarkFromRequest, resolveTheme } from '$lib/domain/theme';
import { translate } from '$lib/i18n/messages';
import { writeThemeCookie } from '$lib/infrastructure/theme-cookie';
import { writeLocaleCookie } from '$lib/infrastructure/locale-cookie';
import { resolveLocaleForRequest } from '$lib/server/locale';
import { expiryReminderService } from '$lib/server/di';
import { DEFAULT_PLAN_TIER } from '$lib/domain/plan';
import { isMarketingPath, isExpiringSharePath } from '$lib/marketing/routes';
import { APP_HOME_PATH } from '$lib/navigation/app-home';
import { VERIFY_EMAIL_PATH } from '$lib/navigation/email-verification';
import { applySecurityHeaders } from '$lib/server/security-headers';
import { redirect, json, type Handle, type HandleServerError } from '@sveltejs/kit';

const publicPaths = new Set(['/login', '/register', '/forgot-password']);

function isPasswordResetPath(pathname: string): boolean {
	return pathname.startsWith('/reset-password/');
}

function isEmailVerificationPath(pathname: string): boolean {
	return pathname === '/verify-email' || pathname.startsWith('/verify-email/');
}

function isGoogleAuthPath(pathname: string): boolean {
	return pathname === '/auth/google' || pathname.startsWith('/auth/google/');
}

function isInvitePath(pathname: string): boolean {
	return pathname.startsWith('/invite/');
}

function isExpiringSharePublicPath(pathname: string): boolean {
	return isExpiringSharePath(pathname);
}

function isVerificationExemptApiPath(pathname: string): boolean {
	return (
		pathname.startsWith('/api/health') ||
		pathname.startsWith('/api/cron/') ||
		pathname === '/api/push/vapid-public-key' ||
		pathname === '/api/product-events' ||
		pathname === '/api/cookie-consent' ||
		pathname === '/api/stripe/webhook' ||
		pathname === '/api/inbound/kivra'
	);
}

function isPublicPath(pathname: string): boolean {
	return (
		publicPaths.has(pathname) ||
		isPasswordResetPath(pathname) ||
		isEmailVerificationPath(pathname) ||
		isGoogleAuthPath(pathname) ||
		isInvitePath(pathname) ||
		isExpiringSharePublicPath(pathname) ||
		isMarketingPath(pathname) ||
		pathname === '/robots.txt' ||
		pathname === '/sitemap.xml' ||
		isVerificationExemptApiPath(pathname)
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	await initDatabase();

	event.locals.authService = authService;
	event.locals.passwordResetService = passwordResetService;
	event.locals.emailVerificationService = emailVerificationService;
	event.locals.oauthService = oauthService;
	event.locals.profileService = profileService;
	event.locals.adminService = adminService;
	event.locals.householdService = householdService;
	event.locals.householdId = null;
	event.locals.householdRole = null;
	event.locals.planTier = DEFAULT_PLAN_TIER;
	event.locals.inventoryService = inventoryService;
	event.locals.statistikService = statistikService;
	event.locals.gamificationService = gamificationService;
	event.locals.wrappedService = wrappedService;
	event.locals.shoppingListService = shoppingListService;
	event.locals.mealPlanService = mealPlanService;
	event.locals.weeklyRitualService = weeklyRitualService;
	event.locals.petService = petService;
	event.locals.petFoodService = petFoodService;
	event.locals.pmfService = pmfService;
	event.locals.productFeedbackService = productFeedbackService;
	event.locals.pmfSurveyService = pmfSurveyService;
	event.locals.planLimitsService = planLimitsService;
	event.locals.aiRateLimitService = aiRateLimitService;
	event.locals.aiUsageAdminService = aiUsageAdminService;
	event.locals.waitlistService = waitlistService;
	event.locals.billingService = billingService;
	event.locals.purchasePatternService = purchasePatternService;

	const { pathname: requestPathname } = event.url;
	const locale = resolveLocaleForRequest(event.cookies, event.request, {
		marketingPath: isMarketingPath(requestPathname)
	});
	event.locals.locale = locale;
	writeLocaleCookie(event.cookies, locale);

	await validateSession(event);

	if (event.locals.user) {
		await recordUserActivity(event.locals.user.id);
		void expiryReminderService.maybeSendReminderForUser(event.locals.user.id).catch((error) => {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`[expiry-reminder] login check failed for ${event.locals.user!.id}: ${message}`);
		});
		event.locals.householdId = await resolveHouseholdId(
			event.locals.householdService,
			event.locals.user.id
		);
		if (event.locals.householdId) {
			event.locals.householdRole = await event.locals.householdService.getRoleForUser(
				event.locals.householdId,
				event.locals.user.id
			);
			event.locals.planTier = await billingService.getPlanTier(event.locals.householdId);
		}
	}

	const { pathname } = event.url;
	const isPublic = isPublicPath(pathname);
	const isAuthenticated = !!event.locals.user;

	if (
		isAuthenticated &&
		shouldRedirectUnverifiedUser(event.locals.user, pathname) &&
		(!pathname.startsWith('/api/') || !isVerificationExemptApiPath(pathname))
	) {
		if (pathname.startsWith('/api/')) {
			return json(
				{ ok: false, error: translate(locale, 'errors.api.emailNotVerified') },
				{ status: 403 }
			);
		}
		redirect(302, '/verify-email');
	}

	if (!isAuthenticated && !isPublic) {
		if (pathname.startsWith('/api/')) {
			return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}
		redirect(302, '/login');
	}

	if (
		isAuthenticated &&
		publicPaths.has(pathname) &&
		!isInvitePath(pathname) &&
		!isPasswordResetPath(pathname) &&
		!isEmailVerificationPath(pathname)
	) {
		if (shouldRedirectUnverifiedUser(event.locals.user, pathname)) {
			redirect(302, VERIFY_EMAIL_PATH);
		}
		redirect(302, APP_HOME_PATH);
	}

	if (pathname.startsWith('/admin') && isAuthenticated && !isAdmin(event.locals.user)) {
		redirect(302, APP_HOME_PATH);
	}

	let resolvedTheme: 'light' | 'dark' = 'light';
	const resolvedLocale = locale;

	if (isAuthenticated) {
		const rawPreference = event.locals.user!.themePreference;
		const preference =
			rawPreference && isThemePreference(rawPreference) ? rawPreference : 'system';
		writeThemeCookie(event.cookies, preference);
		resolvedTheme = resolveTheme(preference, prefersDarkFromRequest(event.request));
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			if (!done) {
				return html;
			}
			return html
				.replaceAll('%pantry.resolvedTheme%', resolvedTheme)
				.replaceAll('%pantry.locale%', resolvedLocale);
		}
	});
	applySecurityHeaders(response);
	return response;
};

export const handleError: HandleServerError = async ({ error, event, status }) => {
	if (status >= 500) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[handleError] ${event.request.method} ${event.url.pathname}: ${message}`);
	}

	if (shouldPersistServerError(error, status)) {
		await recordAppError({
			error,
			path: `${event.request.method} ${event.url.pathname}`,
			userId: event.locals.user?.id ?? null,
			statusCode: status
		});
	}

	const locale = event.locals.locale ?? 'sv';

	return {
		message:
			status >= 500
				? translate(locale, 'common.errorUnexpected')
				: translate(locale, 'common.errorGeneric')
	};
};
