import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GuideArticleService } from '$lib/application/guide-article.service';
import { DrizzleGuideArticleRepository } from '$lib/infrastructure/repositories/guide-article.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Guide article integration', () => {
	let integrationDb: IntegrationDbContext;
	let guideArticleService: GuideArticleService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		guideArticleService = new GuideArticleService(
			new DrizzleGuideArticleRepository(integrationDb.db)
		);
	}, 30_000);

	beforeEach(async () => {
		await integrationDb.reset();
	});

	afterAll(async () => {
		await integrationDb.close();
	});

	it('persists draft and transitions through approve and publish', async () => {
		await integrationDb.seedUser({ id: 'admin-user', email: 'admin@example.com' });

		const draft = await guideArticleService.createDraft({
			slug: 'integration-guide',
			title: 'Integration guide',
			description: 'Description for integration guide article.',
			body: '## Section\n\nGuide body content.',
			keywords: ['integration'],
			articleDate: '2026-06-01',
			source: 'agent'
		});

		expect(draft.status).toBe('draft');

		const approved = await guideArticleService.approve(draft.id, 'admin-user');
		expect(approved.status).toBe('approved');

		const published = await guideArticleService.markPublished(draft.id);
		expect(published.status).toBe('published');
		expect(published.publishedAt).toBeTruthy();
	});
});
