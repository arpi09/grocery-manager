import { desc, eq } from 'drizzle-orm';
import type {
	CreateSocialPostDraftInput,
	SocialPost,
	SocialPostStatus,
	UpdateSocialPostInput
} from '$lib/domain/social-post';
import { generateId } from '$lib/infrastructure/auth/id';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { socialPostTable } from '$lib/infrastructure/db/schema';

export interface ISocialPostRepository {
	createDraft(input: CreateSocialPostDraftInput): Promise<SocialPost>;
	list(options?: { status?: SocialPostStatus; limit?: number }): Promise<SocialPost[]>;
	get(id: string): Promise<SocialPost | null>;
	update(id: string, input: UpdateSocialPostInput): Promise<SocialPost | null>;
	approve(id: string, approvedBy: string): Promise<SocialPost | null>;
	markPublished(id: string, externalId: string): Promise<SocialPost | null>;
	markFailed(id: string, publishError: string): Promise<SocialPost | null>;
}

function mapRow(row: typeof socialPostTable.$inferSelect): SocialPost {
	return {
		id: row.id,
		channel: row.channel,
		status: row.status,
		title: row.title,
		body: row.body,
		linkUrl: row.linkUrl,
		utmSource: row.utmSource,
		utmMedium: row.utmMedium,
		utmCampaign: row.utmCampaign,
		utmContent: row.utmContent,
		imagePath: row.imagePath,
		source: row.source,
		approvedBy: row.approvedBy,
		approvedAt: row.approvedAt,
		publishedAt: row.publishedAt,
		externalId: row.externalId,
		publishError: row.publishError,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export class DrizzleSocialPostRepository implements ISocialPostRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async createDraft(input: CreateSocialPostDraftInput): Promise<SocialPost> {
		const id = generateId();
		const now = new Date();
		await this.db.insert(socialPostTable).values({
			id,
			channel: input.channel ?? 'linkedin',
			status: 'draft',
			title: input.title ?? null,
			body: input.body,
			linkUrl: input.linkUrl ?? null,
			utmSource: input.utmSource ?? null,
			utmMedium: input.utmMedium ?? null,
			utmCampaign: input.utmCampaign ?? null,
			utmContent: input.utmContent ?? null,
			imagePath: input.imagePath ?? null,
			source: input.source ?? 'manual',
			createdAt: now,
			updatedAt: now
		});

		const created = await this.get(id);
		if (!created) {
			throw new Error('Failed to create social post draft');
		}
		return created;
	}

	async list(options?: { status?: SocialPostStatus; limit?: number }): Promise<SocialPost[]> {
		const limit = options?.limit ?? 50;
		const where = options?.status ? eq(socialPostTable.status, options.status) : undefined;

		const rows = await this.db
			.select()
			.from(socialPostTable)
			.where(where)
			.orderBy(desc(socialPostTable.createdAt))
			.limit(limit);

		return rows.map(mapRow);
	}

	async get(id: string): Promise<SocialPost | null> {
		const rows = await this.db
			.select()
			.from(socialPostTable)
			.where(eq(socialPostTable.id, id))
			.limit(1);

		const row = rows[0];
		return row ? mapRow(row) : null;
	}

	async update(id: string, input: UpdateSocialPostInput): Promise<SocialPost | null> {
		const existing = await this.get(id);
		if (!existing || existing.status === 'published') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(socialPostTable)
			.set({
				title: input.title !== undefined ? input.title : existing.title,
				body: input.body ?? existing.body,
				linkUrl: input.linkUrl !== undefined ? input.linkUrl : existing.linkUrl,
				utmSource: input.utmSource !== undefined ? input.utmSource : existing.utmSource,
				utmMedium: input.utmMedium !== undefined ? input.utmMedium : existing.utmMedium,
				utmCampaign: input.utmCampaign !== undefined ? input.utmCampaign : existing.utmCampaign,
				utmContent: input.utmContent !== undefined ? input.utmContent : existing.utmContent,
				imagePath: input.imagePath !== undefined ? input.imagePath : existing.imagePath,
				updatedAt: now
			})
			.where(eq(socialPostTable.id, id));

		return this.get(id);
	}

	async approve(id: string, approvedBy: string): Promise<SocialPost | null> {
		const existing = await this.get(id);
		if (!existing || (existing.status !== 'draft' && existing.status !== 'failed')) {
			return null;
		}

		const now = new Date();
		await this.db
			.update(socialPostTable)
			.set({
				status: 'approved',
				approvedBy,
				approvedAt: now,
				publishError: null,
				updatedAt: now
			})
			.where(eq(socialPostTable.id, id));

		return this.get(id);
	}

	async markPublished(id: string, externalId: string): Promise<SocialPost | null> {
		const existing = await this.get(id);
		if (!existing || existing.status !== 'approved') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(socialPostTable)
			.set({
				status: 'published',
				publishedAt: now,
				externalId,
				publishError: null,
				updatedAt: now
			})
			.where(eq(socialPostTable.id, id));

		return this.get(id);
	}

	async markFailed(id: string, publishError: string): Promise<SocialPost | null> {
		const existing = await this.get(id);
		if (!existing || existing.status !== 'approved') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(socialPostTable)
			.set({
				status: 'failed',
				publishError,
				updatedAt: now
			})
			.where(eq(socialPostTable.id, id));

		return this.get(id);
	}
}
