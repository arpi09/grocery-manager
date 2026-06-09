import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LinkedInPublishService } from '$lib/application/linkedin-publish.service';
import { SocialPostService } from '$lib/application/social-post.service';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import type { ISocialPostRepository } from '$lib/infrastructure/repositories/social-post.repository';
import type { SocialPost } from '$lib/domain/social-post';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {
		LINKEDIN_CLIENT_ID: 'client-id',
		LINKEDIN_CLIENT_SECRET: 'client-secret',
		LINKEDIN_ORGANIZATION_ID: '12345'
	} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

function makeApprovedPost(): SocialPost {
	const now = new Date();
	return {
		id: 'post-1',
		channel: 'linkedin',
		status: 'approved',
		title: null,
		body: 'Approved post',
		linkUrl: null,
		utmSource: null,
		utmMedium: null,
		utmCampaign: null,
		utmContent: null,
		imagePath: null,
		source: 'agent',
		approvedBy: 'admin',
		approvedAt: now,
		publishedAt: null,
		externalId: null,
		publishError: null,
		createdAt: now,
		updatedAt: now
	};
}

describe('LinkedInPublishService', () => {
	let appSettings: IAppSettingsRepository;
	let socialPostService: SocialPostService;

	beforeEach(() => {
		mockEnv.LINKEDIN_CLIENT_ID = 'client-id';
		mockEnv.LINKEDIN_CLIENT_SECRET = 'client-secret';
		mockEnv.LINKEDIN_ORGANIZATION_ID = '12345';

		const socialRepo: ISocialPostRepository = {
			createDraft: vi.fn(),
			list: vi.fn(),
			get: vi.fn(),
			update: vi.fn(),
			approve: vi.fn(),
			markPublished: vi.fn(),
			markFailed: vi.fn()
		};
		socialPostService = new SocialPostService(socialRepo);

		appSettings = {
			getBoolean: vi.fn(),
			setBoolean: vi.fn(),
			getJson: vi.fn(),
			setJson: vi.fn(),
			getEmailSendingEnabled: vi.fn(),
			setEmailSendingEnabled: vi.fn(),
			getStripeCheckoutEnabled: vi.fn(),
			setStripeCheckoutEnabled: vi.fn(),
			getLinkedInOAuth: vi.fn().mockResolvedValue({
				refreshToken: 'refresh',
				accessToken: 'access',
				expiresAt: new Date(Date.now() + 3_600_000).toISOString()
			}),
			setLinkedInOAuth: vi.fn()
		};
	});

	it('reports not_connected when OAuth tokens are missing', async () => {
		vi.mocked(appSettings.getLinkedInOAuth).mockResolvedValue(null);
		const service = new LinkedInPublishService(appSettings, socialPostService);
		const result = await service.publishApprovedPost(makeApprovedPost());
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error('expected failure');
		expect(result.reason).toBe('not_connected');
	});

	it('rejects draft posts server-side', async () => {
		const service = new LinkedInPublishService(appSettings, socialPostService);
		const result = await service.publishApprovedPost({
			...makeApprovedPost(),
			status: 'draft'
		});
		expect(result.ok).toBe(false);
		if (result.ok) throw new Error('expected failure');
		expect(result.reason).toBe('not_approved');
	});

	it('publishes approved posts when API returns id header', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				new Response(null, {
					status: 201,
					headers: { 'x-restli-id': 'urn:li:share:999' }
				})
			)
		);

		const service = new LinkedInPublishService(appSettings, socialPostService);
		const result = await service.publishApprovedPost(makeApprovedPost());
		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error('expected success');
		expect(result.externalId).toBe('urn:li:share:999');

		vi.unstubAllGlobals();
	});
});
