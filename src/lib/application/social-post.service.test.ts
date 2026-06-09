import { describe, expect, it, vi } from 'vitest';
import { SocialPostError, SocialPostService } from '$lib/application/social-post.service';
import type { ISocialPostRepository } from '$lib/infrastructure/repositories/social-post.repository';
import type { SocialPost } from '$lib/domain/social-post';

function makePost(overrides: Partial<SocialPost> = {}): SocialPost {
	const now = new Date('2026-06-01T10:00:00Z');
	return {
		id: 'post-1',
		channel: 'linkedin',
		status: 'draft',
		title: 'Test',
		body: 'Hello world',
		linkUrl: 'https://skaffu.com/rapport/2026-06',
		utmSource: 'linkedin',
		utmMedium: 'social',
		utmCampaign: 'growth_repost',
		utmContent: 'post_a',
		imagePath: null,
		source: 'agent',
		approvedBy: null,
		approvedAt: null,
		publishedAt: null,
		externalId: null,
		publishError: null,
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

function createRepository(overrides: Partial<ISocialPostRepository> = {}): ISocialPostRepository {
	return {
		createDraft: vi.fn(),
		list: vi.fn(),
		get: vi.fn(),
		update: vi.fn(),
		approve: vi.fn(),
		markPublished: vi.fn(),
		markFailed: vi.fn(),
		...overrides
	};
}

describe('SocialPostService', () => {
	it('builds final URL with UTM params', () => {
		const service = new SocialPostService(createRepository());
		const url = service.buildFinalUrl(makePost());
		expect(url).toBe(
			'https://skaffu.com/rapport/2026-06?utm_source=linkedin&utm_medium=social&utm_campaign=growth_repost&utm_content=post_a'
		);
	});

	it('returns null final URL when link is missing', () => {
		const service = new SocialPostService(createRepository());
		expect(service.buildFinalUrl(makePost({ linkUrl: null }))).toBeNull();
	});

	it('builds copy text with body and built link', () => {
		const service = new SocialPostService(createRepository());
		const text = service.buildCopyText(makePost());
		expect(text).toContain('Hello world');
		expect(text).toContain('utm_source=linkedin');
	});

	it('rejects empty draft body', async () => {
		const service = new SocialPostService(createRepository());
		await expect(service.createDraft({ body: '   ' })).rejects.toThrow(SocialPostError);
	});

	it('approves through repository', async () => {
		const approved = makePost({ status: 'approved', approvedBy: 'admin-1' });
		const repository = createRepository({
			approve: vi.fn().mockResolvedValue(approved)
		});
		const service = new SocialPostService(repository);
		await expect(service.approve('post-1', 'admin-1')).resolves.toEqual(approved);
	});

	it('only allows publishing approved posts', () => {
		const service = new SocialPostService(createRepository());
		expect(() => service.assertApprovedForPublish(makePost({ status: 'draft' }))).toThrow(
			SocialPostError
		);
		expect(() => service.assertApprovedForPublish(makePost({ status: 'approved' }))).not.toThrow();
	});

	it('markPublished requires approved status in repository', async () => {
		const repository = createRepository({
			markPublished: vi.fn().mockResolvedValue(null)
		});
		const service = new SocialPostService(repository);
		await expect(service.markPublished('post-1', 'urn:li:share:1')).rejects.toBeInstanceOf(
			SocialPostError
		);
	});
});
