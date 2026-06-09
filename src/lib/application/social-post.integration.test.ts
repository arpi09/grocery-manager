import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SocialPostService } from '$lib/application/social-post.service';
import { DrizzleSocialPostRepository } from '$lib/infrastructure/repositories/social-post.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';

describe('Social post integration', () => {
	let integrationDb: IntegrationDbContext;
	let socialPostService: SocialPostService;

	beforeAll(async () => {
		integrationDb = await createIntegrationDb();
		socialPostService = new SocialPostService(
			new DrizzleSocialPostRepository(integrationDb.db)
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

		const draft = await socialPostService.createDraft({
			body: 'Integration draft',
			linkUrl: 'https://skaffu.com/',
			utmSource: 'linkedin',
			utmMedium: 'social',
			utmCampaign: 'test',
			source: 'agent'
		});

		expect(draft.status).toBe('draft');
		expect(socialPostService.buildFinalUrl(draft)).toContain('utm_source=linkedin');

		const approved = await socialPostService.approve(draft.id, 'admin-user');
		expect(approved.status).toBe('approved');
		expect(approved.approvedBy).toBe('admin-user');

		const published = await socialPostService.markPublished(draft.id, 'urn:li:share:123');
		expect(published.status).toBe('published');
		expect(published.externalId).toBe('urn:li:share:123');
	});

	it('marks failed publish from approved status', async () => {
		await integrationDb.seedUser({ id: 'admin-user', email: 'admin@example.com' });

		const draft = await socialPostService.createDraft({ body: 'Will fail', source: 'manual' });
		await socialPostService.approve(draft.id, 'admin-user');

		const failed = await socialPostService.markFailed(draft.id, 'API scope missing');
		expect(failed.status).toBe('failed');
		expect(failed.publishError).toBe('API scope missing');
	});
});
