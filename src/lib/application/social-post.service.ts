import { appendSearchParamsToAppPath } from '$lib/marketing/utm-params';
import type {
	CreateSocialPostDraftInput,
	SocialPost,
	SocialPostStatus,
	UpdateSocialPostInput
} from '$lib/domain/social-post';
import type { ISocialPostRepository } from '$lib/infrastructure/repositories/social-post.repository';

export class SocialPostError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SocialPostError';
	}
}

export class SocialPostService {
	constructor(private readonly repository: ISocialPostRepository) {}

	createDraft(input: CreateSocialPostDraftInput): Promise<SocialPost> {
		const body = input.body.trim();
		if (!body) {
			return Promise.reject(new SocialPostError('Post body is required'));
		}
		return this.repository.createDraft({ ...input, body });
	}

	list(options?: { status?: SocialPostStatus; limit?: number }): Promise<SocialPost[]> {
		return this.repository.list(options);
	}

	get(id: string): Promise<SocialPost | null> {
		return this.repository.get(id);
	}

	update(id: string, input: UpdateSocialPostInput): Promise<SocialPost> {
		if (input.body !== undefined && !input.body.trim()) {
			throw new SocialPostError('Post body cannot be empty');
		}
		return this.repository.update(id, input).then((post) => {
			if (!post) {
				throw new SocialPostError('Post not found or cannot be edited');
			}
			return post;
		});
	}

	approve(id: string, approvedBy: string): Promise<SocialPost> {
		return this.repository.approve(id, approvedBy).then((post) => {
			if (!post) {
				throw new SocialPostError('Post not found or cannot be approved');
			}
			return post;
		});
	}

	markPublished(id: string, externalId: string): Promise<SocialPost> {
		return this.repository.markPublished(id, externalId).then((post) => {
			if (!post) {
				throw new SocialPostError('Post must be approved before publishing');
			}
			return post;
		});
	}

	markFailed(id: string, publishError: string): Promise<SocialPost> {
		return this.repository.markFailed(id, publishError).then((post) => {
			if (!post) {
				throw new SocialPostError('Post must be approved before marking publish failure');
			}
			return post;
		});
	}

	buildFinalUrl(post: Pick<
		SocialPost,
		'linkUrl' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent'
	>): string | null {
		if (!post.linkUrl?.trim()) {
			return null;
		}

		const params = new URLSearchParams();
		if (post.utmSource?.trim()) {
			params.set('utm_source', post.utmSource.trim());
		}
		if (post.utmMedium?.trim()) {
			params.set('utm_medium', post.utmMedium.trim());
		}
		if (post.utmCampaign?.trim()) {
			params.set('utm_campaign', post.utmCampaign.trim());
		}
		if (post.utmContent?.trim()) {
			params.set('utm_content', post.utmContent.trim());
		}

		return appendSearchParamsToAppPath(post.linkUrl.trim(), params);
	}

	buildCopyText(post: SocialPost): string {
		const parts = [post.body.trim()];
		const url = this.buildFinalUrl(post);
		if (url) {
			parts.push('', url);
		}
		return parts.join('\n');
	}

	assertApprovedForPublish(post: SocialPost | null): asserts post is SocialPost {
		if (!post) {
			throw new SocialPostError('Post not found');
		}
		if (post.status !== 'approved') {
			throw new SocialPostError('Only approved posts can be published');
		}
	}
}
