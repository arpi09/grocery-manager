import type { LinkedInOAuthTokens } from '$lib/domain/app-settings';
import type { SocialPost } from '$lib/domain/social-post';
import type { IAppSettingsRepository } from '$lib/infrastructure/repositories/app-settings.repository';
import {
	getLinkedInOrganizationId,
	isLinkedInApiConfigured,
	refreshLinkedInAccessToken
} from '$lib/server/linkedin-oauth';
import type { SocialPostService } from '$lib/application/social-post.service';

const LINKEDIN_POSTS_URL = 'https://api.linkedin.com/rest/posts';
const LINKEDIN_API_VERSION = '202405';

export interface LinkedInConnectionStatus {
	configured: boolean;
	connected: boolean;
	organizationId: string | null;
	scopeHint: string | null;
}

export type LinkedInPublishResult =
	| { ok: true; externalId: string }
	| { ok: false; reason: 'not_configured' | 'not_connected' | 'not_approved' | 'api_error'; message: string };

export class LinkedInPublishService {
	constructor(
		private readonly appSettings: IAppSettingsRepository,
		private readonly socialPostService: SocialPostService
	) {}

	async getConnectionStatus(): Promise<LinkedInConnectionStatus> {
		const configured = isLinkedInApiConfigured();
		const tokens = await this.appSettings.getLinkedInOAuth();
		return {
			configured,
			connected: Boolean(tokens?.refreshToken),
			organizationId: getLinkedInOrganizationId(),
			scopeHint: configured
				? 'Requires w_organization_social approval from LinkedIn Developer Portal'
				: 'Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_ORGANIZATION_ID'
		};
	}

	async publishApprovedPost(post: SocialPost): Promise<LinkedInPublishResult> {
		if (!isLinkedInApiConfigured()) {
			return {
				ok: false,
				reason: 'not_configured',
				message: 'LinkedIn API env vars are not configured'
			};
		}

		try {
			this.socialPostService.assertApprovedForPublish(post);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Post is not approved';
			return { ok: false, reason: 'not_approved', message };
		}

		const accessToken = await this.resolveAccessToken();
		if (!accessToken) {
			return {
				ok: false,
				reason: 'not_connected',
				message: 'LinkedIn is not connected — use Koppla LinkedIn in admin'
			};
		}

		const organizationId = getLinkedInOrganizationId();
		if (!organizationId) {
			return {
				ok: false,
				reason: 'not_configured',
				message: 'LINKEDIN_ORGANIZATION_ID is missing'
			};
		}

		const commentary = this.socialPostService.buildCopyText(post);
		const payload = {
			author: `urn:li:organization:${organizationId}`,
			commentary,
			visibility: 'PUBLIC',
			distribution: {
				feedDistribution: 'MAIN_FEED',
				targetEntities: [],
				thirdPartyDistributionChannels: []
			},
			lifecycleState: 'PUBLISHED'
		};

		try {
			const response = await fetch(LINKEDIN_POSTS_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					'LinkedIn-Version': LINKEDIN_API_VERSION,
					'X-Restli-Protocol-Version': '2.0.0'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const detail = await response.text();
				return {
					ok: false,
					reason: 'api_error',
					message: `LinkedIn API error (${response.status}): ${detail}`
				};
			}

			const externalId = response.headers.get('x-restli-id') ?? response.headers.get('X-RestLi-Id');
			if (!externalId) {
				return {
					ok: false,
					reason: 'api_error',
					message: 'LinkedIn API succeeded but no post id was returned'
				};
			}

			return { ok: true, externalId };
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return { ok: false, reason: 'api_error', message };
		}
	}

	async storeOAuthTokens(tokenResponse: {
		access_token: string;
		expires_in: number;
		refresh_token?: string;
	}): Promise<void> {
		const existing = await this.appSettings.getLinkedInOAuth();
		const refreshToken = tokenResponse.refresh_token ?? existing?.refreshToken;
		if (!refreshToken) {
			throw new Error('LinkedIn did not return a refresh token');
		}

		const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();
		await this.appSettings.setLinkedInOAuth({
			refreshToken,
			accessToken: tokenResponse.access_token,
			expiresAt
		});
	}

	private async resolveAccessToken(): Promise<string | null> {
		const tokens = await this.appSettings.getLinkedInOAuth();
		if (!tokens?.refreshToken) {
			return null;
		}

		const expiresAt = tokens.expiresAt ? Date.parse(tokens.expiresAt) : 0;
		const stillValid = tokens.accessToken && expiresAt > Date.now() + 60_000;
		if (stillValid && tokens.accessToken) {
			return tokens.accessToken;
		}

		const refreshed = await refreshLinkedInAccessToken(tokens.refreshToken);
		await this.storeOAuthTokens(refreshed);
		return refreshed.access_token;
	}
}
