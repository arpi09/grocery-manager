import { AdminError } from '$lib/application/admin.service';
import { GuideArticleError } from '$lib/application/guide-article.service';
import { SocialPostError } from '$lib/application/social-post.service';
import {
	ensureLinkedInSeedDraft,
	repairStaleLinkedInSeedDraft
} from '$lib/infrastructure/db/seed-social-post';
import {
	LINKEDIN_DEFAULT_UTM,
	resolveDefaultSocialLink
} from '$lib/marketing/linkedin-draft-defaults';
import { skaffurapportService } from '$lib/server/di';
import { lucia } from '$lib/infrastructure/auth/lucia';
import {
	adminLogoutAllSchema,
	adminPasswordResetSchema,
	adminSetEmailSendingSchema,
	adminSetStripeCheckoutSchema,
	adminSetHouseholdPlanSchema,
	adminSetPetsSchema,
	adminSetRoleSchema,
	adminSocialPostIdSchema,
	adminGuideArticleIdSchema,
	adminUpdateGuideArticleSchema,
	adminUpdateSocialPostSchema,
	adminUserIdSchema
} from '$lib/validation/admin.schemas';
import { appSettingsService, linkedInPublishService } from '$lib/server/di';
import { getOpenAiApiKey } from '$lib/server/openai';
import { fail, redirect } from '@sveltejs/kit';
import { appendActionToast } from '$lib/utils/action-toast';
import { translate } from '$lib/i18n/messages';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { user } = await parent();
	const tab = url.searchParams.get('tab');
	const seedDeps = { skaffurapportService };
	if (tab === 'social') {
		await repairStaleLinkedInSeedDraft(seedDeps);
	}
	await ensureLinkedInSeedDraft(seedDeps);
	const [stats, emailSending, stripeCheckout, linkedIn] = await Promise.all([
		locals.adminService.getDashboardStats(),
		appSettingsService.getEmailSendingStatus(),
		appSettingsService.getStripeCheckoutStatus(),
		linkedInPublishService.getConnectionStatus()
	]);

	return {
		user,
		stats,
		emailSending,
		stripeCheckout,
		linkedIn,
		openAiConfigured: !!getOpenAiApiKey(),
		tab
	};
};

export const actions: Actions = {
	setEmailSending: async ({ request }) => {
		const formData = await request.formData();
		const parsed = adminSetEmailSendingSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid email sending update.' });
		}

		await appSettingsService.setEmailSendingEnabled(parsed.data.enabled === 'true');
		redirect(302, appendActionToast('/admin', 'adminSaved'));
	},
	setStripeCheckout: async ({ request }) => {
		const formData = await request.formData();
		const parsed = adminSetStripeCheckoutSchema.safeParse({
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid Stripe checkout update.' });
		}

		await appSettingsService.setStripeCheckoutEnabled(parsed.data.enabled === 'true');
		redirect(302, appendActionToast('/admin', 'adminSaved'));
	},
	setRole: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSetRoleSchema.safeParse({
			userId: formData.get('userId'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid role update.' });
		}

		try {
			await locals.adminService.setUserRole(
				locals.user!.id,
				parsed.data.userId,
				parsed.data.role
			);
		} catch (error) {
			if (error instanceof AdminError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin', 'adminSaved'));
	},
	setHouseholdPlan: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSetHouseholdPlanSchema.safeParse({
			householdId: formData.get('householdId'),
			planTier: formData.get('planTier'),
			clearStripe: formData.get('clearStripe')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.invalidHouseholdPlan') });
		}

		try {
			await locals.adminService.setHouseholdPlan(
				locals.user!.id,
				parsed.data.householdId,
				parsed.data.planTier,
				parsed.data.clearStripe === 'true'
			);
		} catch (error) {
			if (error instanceof AdminError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=users', 'adminSaved'));
	},
	setPets: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSetPetsSchema.safeParse({
			userId: formData.get('userId'),
			enabled: formData.get('enabled')
		});

		if (!parsed.success) {
			return fail(400, { message: 'Invalid pets update.' });
		}

		await locals.adminService.setUserPetsEnabled(
			parsed.data.userId,
			parsed.data.enabled === 'true'
		);
		redirect(302, appendActionToast('/admin', 'adminSaved'));
	},
	logoutAll: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsed = adminLogoutAllSchema.safeParse({
			confirm: formData.get('confirm')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.logoutConfirmRequired') });
		}

		const sessionCount = await locals.adminService.logoutAllUsers();
		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		redirect(
			302,
			`/login?message=${encodeURIComponent(translate(locals.locale, 'admin.loggedOutAll', { count: sessionCount }))}`
		);
	},
	sendPasswordReset: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminPasswordResetSchema.safeParse({
			userId: formData.get('userId'),
			forceReset: formData.get('forceReset')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.invalidUser') });
		}

		const emailLocale = locals.locale === 'en' ? 'en' : 'sv';
		await locals.adminService.sendPasswordResetEmail(locals.user!.id, parsed.data.userId, {
			forceReset: parsed.data.forceReset === 'true',
			locale: emailLocale
		});

		redirect(302, appendActionToast('/admin?tab=users', 'adminPasswordResetSent'));
	},
	updateSocialPost: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminUpdateSocialPostSchema.safeParse({
			postId: formData.get('postId'),
			title: formData.get('title') || null,
			body: formData.get('body') || undefined,
			linkUrl: formData.get('linkUrl'),
			utmSource: formData.get('utmSource') || null,
			utmMedium: formData.get('utmMedium') || null,
			utmCampaign: formData.get('utmCampaign') || null,
			utmContent: formData.get('utmContent') || null
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidUpdate') });
		}

		try {
			await locals.socialPostService.update(parsed.data.postId, {
				title: parsed.data.title,
				body: parsed.data.body,
				linkUrl:
					parsed.data.linkUrl === '' ? null : (parsed.data.linkUrl ?? undefined),
				utmSource: parsed.data.utmSource,
				utmMedium: parsed.data.utmMedium,
				utmCampaign: parsed.data.utmCampaign,
				utmContent: parsed.data.utmContent
			});
		} catch (error) {
			if (error instanceof SocialPostError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminSaved'));
	},
	suggestBetterSocialPostLink: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSocialPostIdSchema.safeParse({
			postId: formData.get('postId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidPost') });
		}

		const post = await locals.socialPostService.get(parsed.data.postId);
		if (!post) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidPost') });
		}

		if (post.status !== 'draft' && post.status !== 'approved' && post.status !== 'failed') {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidUpdate') });
		}

		const suggested = await resolveDefaultSocialLink({ skaffurapportService });
		try {
			await locals.socialPostService.update(parsed.data.postId, {
				linkUrl: suggested.linkUrl,
				utmSource: LINKEDIN_DEFAULT_UTM.utmSource,
				utmMedium: LINKEDIN_DEFAULT_UTM.utmMedium,
				utmCampaign: LINKEDIN_DEFAULT_UTM.utmCampaign,
				utmContent: suggested.utmContent
			});
		} catch (error) {
			if (error instanceof SocialPostError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminSaved'));
	},
	approveSocialPost: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSocialPostIdSchema.safeParse({
			postId: formData.get('postId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidPost') });
		}

		try {
			await locals.socialPostService.approve(parsed.data.postId, locals.user!.id);
		} catch (error) {
			if (error instanceof SocialPostError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminSocialPostApproved'));
	},
	publishSocialPost: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminSocialPostIdSchema.safeParse({
			postId: formData.get('postId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidPost') });
		}

		const post = await locals.socialPostService.get(parsed.data.postId);
		if (!post) {
			return fail(400, { message: translate(locals.locale, 'admin.socialPosts.invalidPost') });
		}

		const result = await locals.linkedInPublishService.publishApprovedPost(post);

		if (!result.ok) {
			if (post.status === 'approved') {
				await locals.socialPostService.markFailed(parsed.data.postId, result.message);
			}
			redirect(
				302,
				appendActionToast('/admin?tab=social', 'adminSocialPostPublishFailed', result.message)
			);
		}

		await locals.socialPostService.markPublished(parsed.data.postId, result.externalId);
		redirect(302, appendActionToast('/admin?tab=social', 'adminSocialPostPublished'));
	},
	updateGuide: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminUpdateGuideArticleSchema.safeParse({
			guideId: formData.get('guideId'),
			title: formData.get('title') || undefined,
			description: formData.get('description') || undefined,
			body: formData.get('body') || undefined
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.marketingCampaigns.invalidUpdate') });
		}

		try {
			await locals.guideArticleService.update(parsed.data.guideId, {
				title: parsed.data.title,
				description: parsed.data.description,
				body: parsed.data.body
			});
		} catch (error) {
			if (error instanceof GuideArticleError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminSaved'));
	},
	approveGuide: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminGuideArticleIdSchema.safeParse({
			guideId: formData.get('guideId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.marketingCampaigns.invalidGuide') });
		}

		try {
			await locals.guideArticleService.approve(parsed.data.guideId, locals.user!.id);
		} catch (error) {
			if (error instanceof GuideArticleError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminGuideApproved'));
	},
	publishGuide: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = adminGuideArticleIdSchema.safeParse({
			guideId: formData.get('guideId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.marketingCampaigns.invalidGuide') });
		}

		try {
			await locals.guideArticleService.markPublished(parsed.data.guideId);
		} catch (error) {
			if (error instanceof GuideArticleError) {
				return fail(400, { message: error.message });
			}
			throw error;
		}

		redirect(302, appendActionToast('/admin?tab=social', 'adminGuidePublished'));
	},
	logoutUser: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const parsed = adminUserIdSchema.safeParse({
			userId: formData.get('userId')
		});

		if (!parsed.success) {
			return fail(400, { message: translate(locals.locale, 'admin.invalidUser') });
		}

		await locals.adminService.logoutUser(parsed.data.userId);

		if (parsed.data.userId === locals.user!.id) {
			const sessionCookie = lucia.createBlankSessionCookie();
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '/',
				...sessionCookie.attributes
			});
			redirect(302, '/login?message=' + encodeURIComponent(translate(locals.locale, 'admin.loggedOut')));
		}

		redirect(302, appendActionToast('/admin', 'adminSaved'));
	}
};
