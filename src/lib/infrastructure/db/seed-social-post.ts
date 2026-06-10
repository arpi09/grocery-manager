import { eq } from 'drizzle-orm';
import { LINKEDIN_SEED_DRAFT_TITLE } from '$lib/domain/social-post';
import { generateId } from '$lib/infrastructure/auth/id';
import { getDb } from '$lib/infrastructure/db';
import { socialPostTable } from '$lib/infrastructure/db/schema';
import {
	isStaleSeedBody,
	LINKEDIN_DEFAULT_UTM,
	LINKEDIN_SEED_BODY,
	parseRapportMonthFromUrl,
	resolveDefaultSocialLink,
	shouldRepairSeedDraftLink,
	type ResolveDefaultSocialLinkDeps
} from '$lib/marketing/linkedin-draft-defaults';

export type SeedSocialPostDeps = ResolveDefaultSocialLinkDeps;

async function loadSeedDraft() {
	const db = getDb();
	const rows = await db
		.select()
		.from(socialPostTable)
		.where(eq(socialPostTable.title, LINKEDIN_SEED_DRAFT_TITLE))
		.limit(1);
	return rows[0] ?? null;
}

/** Inserts the first LinkedIn draft when the queue is empty. */
export async function ensureLinkedInSeedDraft(deps: SeedSocialPostDeps): Promise<string | null> {
	const db = getDb();
	const existing = await db
		.select({ id: socialPostTable.id })
		.from(socialPostTable)
		.where(eq(socialPostTable.title, LINKEDIN_SEED_DRAFT_TITLE))
		.limit(1);

	if (existing.length > 0) {
		return null;
	}

	const countRows = await db.select({ id: socialPostTable.id }).from(socialPostTable).limit(1);
	if (countRows.length > 0) {
		return null;
	}

	const resolved = await resolveDefaultSocialLink(deps);
	const id = generateId();
	const now = new Date();
	await db.insert(socialPostTable).values({
		id,
		channel: 'linkedin',
		status: 'draft',
		title: LINKEDIN_SEED_DRAFT_TITLE,
		body: LINKEDIN_SEED_BODY,
		linkUrl: resolved.linkUrl,
		utmSource: LINKEDIN_DEFAULT_UTM.utmSource,
		utmMedium: LINKEDIN_DEFAULT_UTM.utmMedium,
		utmCampaign: LINKEDIN_DEFAULT_UTM.utmCampaign,
		utmContent: resolved.utmContent,
		source: 'manual',
		createdAt: now,
		updatedAt: now
	});

	return id;
}

/** Repairs the seed draft when link or body is stale (e.g. hardcoded rapport/2026-06). */
export async function repairStaleLinkedInSeedDraft(deps: SeedSocialPostDeps): Promise<boolean> {
	const draft = await loadSeedDraft();
	if (!draft || draft.status !== 'draft') {
		return false;
	}

	const reportMonth = parseRapportMonthFromUrl(draft.linkUrl);
	let meetsKAnonymity: boolean | null = null;
	if (reportMonth) {
		const report = await deps.skaffurapportService.getPublishedReport(reportMonth);
		meetsKAnonymity = report?.meetsKAnonymity ?? false;
	}

	const needsLinkRepair = shouldRepairSeedDraftLink(draft.linkUrl, meetsKAnonymity);
	const needsBodyRepair = isStaleSeedBody(draft.body);
	if (!needsLinkRepair && !needsBodyRepair) {
		return false;
	}

	const resolved = needsLinkRepair ? await resolveDefaultSocialLink(deps) : null;
	const now = new Date();
	const db = getDb();
	await db
		.update(socialPostTable)
		.set({
			body: needsBodyRepair ? LINKEDIN_SEED_BODY : draft.body,
			linkUrl: resolved?.linkUrl ?? draft.linkUrl,
			utmContent: resolved?.utmContent ?? draft.utmContent,
			updatedAt: now
		})
		.where(eq(socialPostTable.id, draft.id));

	return true;
}
