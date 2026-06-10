import type { SkaffurapportSnapshot } from '$lib/domain/skaffurapport';
import { isValidReportMonth } from '$lib/domain/skaffurapport';
import type { GuideListItem } from '$lib/marketing/guides';
import { getLatestPublishedGuides } from '$lib/marketing/guides.server';

export const LINKEDIN_SEED_BODY = `Svenska hushåll kastar mat för miljarder varje år. Ofta för att vi glömmer vad som redan finns i kylen.

Skaffu hjälper hushåll skanna in lager, följa utgångsdatum och generera maträtt från det du har hemma.

Prova gratis på skaffu.com. Fota kylen eller skanna streckkod.`;

export const LINKEDIN_DEFAULT_UTM = {
	utmSource: 'linkedin',
	utmMedium: 'social',
	utmCampaign: 'growth_repost'
} as const;

export const STALE_HARDCODED_RAPPORT_SEGMENT = 'rapport/2026-06';

export type DefaultSocialLinkReason = 'report_ready' | 'latest_guide' | 'landing';

export interface DefaultSocialLink {
	linkUrl: string;
	utmContent: string;
	reason: DefaultSocialLinkReason;
}

export interface ResolveDefaultSocialLinkDeps {
	skaffurapportService: {
		getPublishedReport(month: string): Promise<SkaffurapportSnapshot | null>;
	};
	getLatestPublishedGuides?: (limit: number) => GuideListItem[] | Promise<GuideListItem[]>;
	now?: Date;
}

export interface SocialPostLinkStatus {
	isRapportLink: boolean;
	reportMonth: string | null;
	meetsKAnonymity: boolean | null;
	needsBetterLink: boolean;
	suggestedLink: DefaultSocialLink | null;
}

/** Previous calendar month as YYYY-MM (UTC). */
export function previousReportMonth(now = new Date()): string {
	const year = now.getUTCFullYear();
	const monthIndex = now.getUTCMonth();
	if (monthIndex === 0) {
		return `${year - 1}-12`;
	}
	return `${year}-${String(monthIndex).padStart(2, '0')}`;
}

export function parseRapportMonthFromUrl(url: string | null | undefined): string | null {
	if (!url?.trim()) {
		return null;
	}

	try {
		const pathname = new URL(url.trim(), 'https://skaffu.com').pathname;
		const match = pathname.match(/^\/rapport\/(\d{4}-\d{2})\/?$/);
		const month = match?.[1];
		return month && isValidReportMonth(month) ? month : null;
	} catch {
		const match = url.match(/\/rapport\/(\d{4}-\d{2})/);
		const month = match?.[1];
		return month && isValidReportMonth(month) ? month : null;
	}
}

export function isHardcodedStaleRapportLink(linkUrl: string | null | undefined): boolean {
	return !!linkUrl?.includes(STALE_HARDCODED_RAPPORT_SEGMENT);
}

export function isStaleSeedBody(body: string): boolean {
	return body.includes('—') || body.includes('Skaffurapporten för juni');
}

export async function resolveDefaultSocialLink(
	deps: ResolveDefaultSocialLinkDeps
): Promise<DefaultSocialLink> {
	const getGuides = deps.getLatestPublishedGuides ?? getLatestPublishedGuides;
	const month = previousReportMonth(deps.now);

	const report = await deps.skaffurapportService.getPublishedReport(month);
	if (report?.meetsKAnonymity) {
		return {
			linkUrl: `https://skaffu.com/rapport/${month}`,
			utmContent: 'post_a',
			reason: 'report_ready'
		};
	}

	const guides = await Promise.resolve(getGuides(1));
	if (guides.length > 0) {
		return {
			linkUrl: `https://skaffu.com/guider/${guides[0].slug}`,
			utmContent: guides[0].slug,
			reason: 'latest_guide'
		};
	}

	return {
		linkUrl: 'https://skaffu.com',
		utmContent: 'photo_tip',
		reason: 'landing'
	};
}

export async function resolveSocialPostLinkStatus(
	linkUrl: string | null | undefined,
	deps: ResolveDefaultSocialLinkDeps
): Promise<SocialPostLinkStatus> {
	const reportMonth = parseRapportMonthFromUrl(linkUrl);
	if (!reportMonth) {
		return {
			isRapportLink: false,
			reportMonth: null,
			meetsKAnonymity: null,
			needsBetterLink: isHardcodedStaleRapportLink(linkUrl),
			suggestedLink: isHardcodedStaleRapportLink(linkUrl)
				? await resolveDefaultSocialLink(deps)
				: null
		};
	}

	const report = await deps.skaffurapportService.getPublishedReport(reportMonth);
	const meetsKAnonymity = report?.meetsKAnonymity ?? false;
	const needsBetterLink = !meetsKAnonymity || isHardcodedStaleRapportLink(linkUrl);

	return {
		isRapportLink: true,
		reportMonth,
		meetsKAnonymity,
		needsBetterLink,
		suggestedLink: needsBetterLink ? await resolveDefaultSocialLink(deps) : null
	};
}

export function shouldRepairSeedDraftLink(
	linkUrl: string | null,
	meetsKAnonymity: boolean | null
): boolean {
	if (isHardcodedStaleRapportLink(linkUrl)) {
		return true;
	}
	const reportMonth = parseRapportMonthFromUrl(linkUrl);
	if (reportMonth && meetsKAnonymity === false) {
		return true;
	}
	return false;
}
