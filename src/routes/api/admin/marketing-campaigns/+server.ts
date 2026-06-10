import { json } from '@sveltejs/kit';
import type { GuideArticle } from '$lib/domain/guide-article';
import { GUIDE_ARTICLE_LIST_DEFAULT, GUIDE_ARTICLE_LIST_MAX } from '$lib/domain/guide-article';
import { resolveSocialPostLinkStatus } from '$lib/marketing/linkedin-draft-defaults';
import { requireAdmin } from '$lib/server/api-guards';
import { skaffurapportService } from '$lib/server/di';
import type { RequestHandler } from './$types';

function parseLimit(raw: string | null): number {
	const parsed = Number(raw ?? GUIDE_ARTICLE_LIST_DEFAULT);
	if (!Number.isFinite(parsed)) {
		return GUIDE_ARTICLE_LIST_DEFAULT;
	}
	return Math.min(GUIDE_ARTICLE_LIST_MAX, Math.max(1, Math.floor(parsed)));
}

function serializeGuide(guide: GuideArticle) {
	return {
		...guide,
		createdAt: guide.createdAt.toISOString(),
		updatedAt: guide.updatedAt.toISOString(),
		approvedAt: guide.approvedAt?.toISOString() ?? null,
		publishedAt: guide.publishedAt?.toISOString() ?? null
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const statusParam = url.searchParams.get('status');
	const status =
		statusParam === 'draft' || statusParam === 'approved' || statusParam === 'published'
			? statusParam
			: undefined;
	const limit = parseLimit(url.searchParams.get('limit'));

	const guides = await locals.guideArticleService.list({ status, limit });
	const linkDeps = { skaffurapportService };

	const campaigns = await Promise.all(
		guides.map(async (guide) => {
			const socialPost = guide.socialPostId
				? await locals.socialPostService.get(guide.socialPostId)
				: null;
			const serializedPost = socialPost
				? {
						...socialPost,
						createdAt: socialPost.createdAt.toISOString(),
						updatedAt: socialPost.updatedAt.toISOString(),
						approvedAt: socialPost.approvedAt?.toISOString() ?? null,
						publishedAt: socialPost.publishedAt?.toISOString() ?? null,
						builtLinkUrl: locals.socialPostService.buildFinalUrl(socialPost),
						linkStatus: await resolveSocialPostLinkStatus(socialPost.linkUrl, linkDeps)
					}
				: null;

			return {
				guide: serializeGuide(guide),
				socialPost: serializedPost
			};
		})
	);

	return json({ campaigns, limit });
};
