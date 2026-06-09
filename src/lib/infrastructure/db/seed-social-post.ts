import { eq } from 'drizzle-orm';
import { LINKEDIN_SEED_DRAFT_TITLE } from '$lib/domain/social-post';
import { generateId } from '$lib/infrastructure/auth/id';
import { getDb } from '$lib/infrastructure/db';
import { socialPostTable } from '$lib/infrastructure/db/schema';

const SEED_BODY = `Svenska hushåll kastar mat för miljarder varje år — ofta för att vi glömmer vad som redan finns i kylen.

Skaffurapporten för juni sammanfattar mönster från hushåll som faktiskt håller koll på lagret (ingen adress, ingen personlig data):

Vill du testa själv: skanna streckkod eller fota kylen — appen fyller lagret åt dig. Gratis att prova.`;

/** Inserts the first LinkedIn draft from docs/LINKEDIN_REPOST.md when the queue is empty. */
export async function ensureLinkedInSeedDraft(): Promise<string | null> {
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

	const id = generateId();
	const now = new Date();
	await db.insert(socialPostTable).values({
		id,
		channel: 'linkedin',
		status: 'draft',
		title: LINKEDIN_SEED_DRAFT_TITLE,
		body: SEED_BODY,
		linkUrl: 'https://skaffu.com/rapport/2026-06',
		utmSource: 'linkedin',
		utmMedium: 'social',
		utmCampaign: 'growth_repost',
		utmContent: 'post_a',
		source: 'manual',
		createdAt: now,
		updatedAt: now
	});

	return id;
}
