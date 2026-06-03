import { json } from '@sveltejs/kit';
import { ADMIN_USER_LIST_DEFAULT, ADMIN_USER_LIST_MAX } from '$lib/domain/admin-users';
import {
	ERROR_LOG_ADMIN_LIST_DEFAULT,
	ERROR_LOG_ADMIN_LIST_MAX
} from '$lib/domain/error-log';
import {
	PRODUCT_FEEDBACK_LIST_DEFAULT,
	PRODUCT_FEEDBACK_LIST_MAX
} from '$lib/domain/product-feedback';
import { STRIPE_READINESS_GATES } from '$lib/domain/plan';
import { parseAdminAiUsagePeriodDays } from '$lib/domain/ai-usage-admin';
import { parsePmfFunnelPeriodDays } from '$lib/domain/pmf-funnel';
import { WAITLIST_LIST_DEFAULT, WAITLIST_LIST_MAX } from '$lib/domain/waitlist';
import { requireAdmin } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

const SECTIONS = ['analytics', 'ai-usage', 'users', 'errors', 'errorStack', 'feedback', 'waitlist'] as const;
type AdminSection = (typeof SECTIONS)[number];

function parseLimit(
	raw: string | null,
	defaultValue: number,
	max: number
): number {
	const parsed = Number(raw ?? defaultValue);
	if (!Number.isFinite(parsed)) {
		return defaultValue;
	}
	return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function parseOffset(raw: string | null): number {
	const parsed = Number(raw ?? 0);
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return Math.max(0, Math.floor(parsed));
}

function isSection(value: string | null): value is AdminSection {
	return value !== null && SECTIONS.includes(value as AdminSection);
}

function serializeRow<T extends object>(row: T): T {
	const out = { ...row } as Record<string, unknown>;
	for (const [key, entry] of Object.entries(out)) {
		if (entry instanceof Date) {
			out[key] = entry.toISOString();
		}
	}
	return out as T;
}

function serializeRows<T extends object>(rows: T[]): T[] {
	return rows.map((row) => serializeRow(row));
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const sectionParam = url.searchParams.get('section');
	if (!isSection(sectionParam)) {
		return json({ error: 'Invalid section' }, { status: 400 });
	}

	switch (sectionParam) {
		case 'analytics': {
			const funnelDays = parsePmfFunnelPeriodDays(url.searchParams.get('funnelDays'));
			const [pmfWeeklyReview, pmfFunnel] = await Promise.all([
				locals.pmfService.getWeeklyReview(),
				locals.pmfService.getFunnelMetrics(funnelDays)
			]);
			return json({ pmfWeeklyReview, pmfFunnel });
		}
		case 'ai-usage': {
			const periodDays = parseAdminAiUsagePeriodDays(url.searchParams.get('days'));
			const aiUsage = await locals.aiUsageAdminService.getSummary(periodDays);
			return json({ aiUsage });
		}
		case 'users': {
			const limit = parseLimit(
				url.searchParams.get('limit'),
				ADMIN_USER_LIST_DEFAULT,
				ADMIN_USER_LIST_MAX
			);
			const offset = parseOffset(url.searchParams.get('offset'));
			const { users, total } = await locals.adminService.listUsers(limit, offset);
			return json({
				users: serializeRows(users),
				total,
				limit,
				offset
			});
		}
		case 'errors': {
			const limit = parseLimit(
				url.searchParams.get('limit'),
				ERROR_LOG_ADMIN_LIST_DEFAULT,
				ERROR_LOG_ADMIN_LIST_MAX
			);
			const errors = await locals.adminService.listRecentErrorSummaries(limit);
			return json({
				errors: serializeRows(errors),
				limit
			});
		}
		case 'errorStack': {
			const id = url.searchParams.get('id')?.trim();
			if (!id) {
				return json({ error: 'Missing id' }, { status: 400 });
			}
			const stack = await locals.adminService.getErrorStack(id);
			return json({ stack });
		}
		case 'feedback': {
			const limit = parseLimit(
				url.searchParams.get('limit'),
				PRODUCT_FEEDBACK_LIST_DEFAULT,
				PRODUCT_FEEDBACK_LIST_MAX
			);
			const productFeedback = await locals.productFeedbackService.listRecent(limit);
			return json({
				productFeedback: serializeRows(productFeedback),
				limit
			});
		}
		case 'waitlist': {
			const limit = parseLimit(
				url.searchParams.get('limit'),
				WAITLIST_LIST_DEFAULT,
				WAITLIST_LIST_MAX
			);
			const [waitlistCount, waitlistEntries] = await Promise.all([
				locals.waitlistService.count(),
				locals.waitlistService.listRecent(limit)
			]);
			return json({
				waitlistCount,
				waitlistTarget: STRIPE_READINESS_GATES.payingWaitlistMin,
				waitlistEntries: serializeRows(waitlistEntries),
				limit
			});
		}
		default:
			return json({ error: 'Invalid section' }, { status: 400 });
	}
};
