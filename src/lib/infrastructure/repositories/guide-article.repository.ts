import { desc, eq } from 'drizzle-orm';
import type {
	CreateGuideArticleDraftInput,
	GuideArticle,
	GuideArticleStatus,
	UpdateGuideArticleInput
} from '$lib/domain/guide-article';
import { generateId } from '$lib/infrastructure/auth/id';
import { db as defaultDb, type AppDatabase } from '$lib/infrastructure/db';
import { guideArticleTable } from '$lib/infrastructure/db/schema';

export interface IGuideArticleRepository {
	createDraft(input: CreateGuideArticleDraftInput): Promise<GuideArticle>;
	list(options?: { status?: GuideArticleStatus; limit?: number }): Promise<GuideArticle[]>;
	listSlugs(): Promise<string[]>;
	listPublished(): Promise<GuideArticle[]>;
	get(id: string): Promise<GuideArticle | null>;
	getBySlug(slug: string): Promise<GuideArticle | null>;
	update(id: string, input: UpdateGuideArticleInput): Promise<GuideArticle | null>;
	approve(id: string, approvedBy: string): Promise<GuideArticle | null>;
	markPublished(id: string): Promise<GuideArticle | null>;
}

function mapRow(row: typeof guideArticleTable.$inferSelect): GuideArticle {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		body: row.body,
		keywords: row.keywords ?? [],
		articleDate: row.articleDate,
		status: row.status,
		source: row.source,
		socialPostId: row.socialPostId,
		qualityWarnings: row.qualityWarnings ?? null,
		approvedBy: row.approvedBy,
		approvedAt: row.approvedAt,
		publishedAt: row.publishedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export class DrizzleGuideArticleRepository implements IGuideArticleRepository {
	constructor(private readonly db: AppDatabase = defaultDb) {}

	async createDraft(input: CreateGuideArticleDraftInput): Promise<GuideArticle> {
		const id = generateId();
		const now = new Date();
		await this.db.insert(guideArticleTable).values({
			id,
			slug: input.slug,
			title: input.title,
			description: input.description,
			body: input.body,
			keywords: input.keywords,
			articleDate: input.articleDate,
			status: 'draft',
			source: input.source ?? 'agent',
			socialPostId: input.socialPostId ?? null,
			qualityWarnings: input.qualityWarnings ?? null,
			createdAt: now,
			updatedAt: now
		});

		const created = await this.get(id);
		if (!created) {
			throw new Error('Failed to create guide article draft');
		}
		return created;
	}

	async list(options?: { status?: GuideArticleStatus; limit?: number }): Promise<GuideArticle[]> {
		const limit = options?.limit ?? 50;
		const where = options?.status ? eq(guideArticleTable.status, options.status) : undefined;

		const rows = await this.db
			.select()
			.from(guideArticleTable)
			.where(where)
			.orderBy(desc(guideArticleTable.createdAt))
			.limit(limit);

		return rows.map(mapRow);
	}

	async listSlugs(): Promise<string[]> {
		const rows = await this.db.select({ slug: guideArticleTable.slug }).from(guideArticleTable);
		return rows.map((row) => row.slug);
	}

	async listPublished(): Promise<GuideArticle[]> {
		const rows = await this.db
			.select()
			.from(guideArticleTable)
			.where(eq(guideArticleTable.status, 'published'))
			.orderBy(desc(guideArticleTable.articleDate));

		return rows.map(mapRow);
	}

	async get(id: string): Promise<GuideArticle | null> {
		const rows = await this.db
			.select()
			.from(guideArticleTable)
			.where(eq(guideArticleTable.id, id))
			.limit(1);

		const row = rows[0];
		return row ? mapRow(row) : null;
	}

	async getBySlug(slug: string): Promise<GuideArticle | null> {
		const rows = await this.db
			.select()
			.from(guideArticleTable)
			.where(eq(guideArticleTable.slug, slug))
			.limit(1);

		const row = rows[0];
		return row ? mapRow(row) : null;
	}

	async update(id: string, input: UpdateGuideArticleInput): Promise<GuideArticle | null> {
		const existing = await this.get(id);
		if (!existing || existing.status === 'published') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(guideArticleTable)
			.set({
				title: input.title ?? existing.title,
				description: input.description ?? existing.description,
				body: input.body ?? existing.body,
				keywords: input.keywords ?? existing.keywords,
				updatedAt: now
			})
			.where(eq(guideArticleTable.id, id));

		return this.get(id);
	}

	async approve(id: string, approvedBy: string): Promise<GuideArticle | null> {
		const existing = await this.get(id);
		if (!existing || existing.status !== 'draft') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(guideArticleTable)
			.set({
				status: 'approved',
				approvedBy,
				approvedAt: now,
				updatedAt: now
			})
			.where(eq(guideArticleTable.id, id));

		return this.get(id);
	}

	async markPublished(id: string): Promise<GuideArticle | null> {
		const existing = await this.get(id);
		if (!existing || existing.status !== 'approved') {
			return null;
		}

		const now = new Date();
		await this.db
			.update(guideArticleTable)
			.set({
				status: 'published',
				publishedAt: now,
				updatedAt: now
			})
			.where(eq(guideArticleTable.id, id));

		return this.get(id);
	}
}
