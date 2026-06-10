import { describe, expect, it, vi } from 'vitest';
import { GuideArticleError, GuideArticleService } from '$lib/application/guide-article.service';
import type { IGuideArticleRepository } from '$lib/infrastructure/repositories/guide-article.repository';
import type { GuideArticle } from '$lib/domain/guide-article';

function makeArticle(overrides: Partial<GuideArticle> = {}): GuideArticle {
	const now = new Date('2026-06-01T10:00:00Z');
	return {
		id: 'guide-1',
		slug: 'test-guide',
		title: 'Test guide',
		description: 'A short description for the guide article preview.',
		body: '## Intro\n\nBody text here.',
		keywords: ['test'],
		articleDate: '2026-06-01',
		status: 'draft',
		source: 'agent',
		socialPostId: 'post-1',
		qualityWarnings: null,
		approvedBy: null,
		approvedAt: null,
		publishedAt: null,
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

function createRepository(overrides: Partial<IGuideArticleRepository> = {}): IGuideArticleRepository {
	return {
		createDraft: vi.fn(),
		list: vi.fn(),
		listSlugs: vi.fn(),
		listPublished: vi.fn(),
		get: vi.fn(),
		getBySlug: vi.fn(),
		update: vi.fn(),
		approve: vi.fn(),
		markPublished: vi.fn(),
		...overrides
	};
}

describe('GuideArticleService', () => {
	it('rejects empty draft fields', async () => {
		const service = new GuideArticleService(createRepository());
		await expect(
			service.createDraft({
				slug: 'x',
				title: ' ',
				description: 'desc',
				body: 'body',
				keywords: [],
				articleDate: '2026-06-01'
			})
		).rejects.toThrow(GuideArticleError);
	});

	it('approves through repository', async () => {
		const approved = makeArticle({ status: 'approved', approvedBy: 'admin-1' });
		const repository = createRepository({
			approve: vi.fn().mockResolvedValue(approved)
		});
		const service = new GuideArticleService(repository);
		await expect(service.approve('guide-1', 'admin-1')).resolves.toEqual(approved);
	});

	it('markPublished requires approved status in repository', async () => {
		const repository = createRepository({
			markPublished: vi.fn().mockResolvedValue(null)
		});
		const service = new GuideArticleService(repository);
		await expect(service.markPublished('guide-1')).rejects.toBeInstanceOf(GuideArticleError);
	});

	it('returns only published articles from getPublishedBySlug', async () => {
		const repository = createRepository({
			getBySlug: vi.fn().mockResolvedValue(makeArticle({ status: 'draft' }))
		});
		const service = new GuideArticleService(repository);
		await expect(service.getPublishedBySlug('test-guide')).resolves.toBeNull();
	});
});
