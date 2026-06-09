import { json } from '@sveltejs/kit';
import { SocialPostError } from '$lib/application/social-post.service';
import { SOCIAL_POST_LIST_DEFAULT, SOCIAL_POST_LIST_MAX } from '$lib/domain/social-post';
import { requireAdmin } from '$lib/server/api-guards';
import { adminCreateSocialPostSchema } from '$lib/validation/admin.schemas';
import type { RequestHandler } from './$types';

function parseLimit(raw: string | null): number {
	const parsed = Number(raw ?? SOCIAL_POST_LIST_DEFAULT);
	if (!Number.isFinite(parsed)) {
		return SOCIAL_POST_LIST_DEFAULT;
	}
	return Math.min(SOCIAL_POST_LIST_MAX, Math.max(1, Math.floor(parsed)));
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const statusParam = url.searchParams.get('status');
	const status =
		statusParam === 'draft' ||
		statusParam === 'approved' ||
		statusParam === 'published' ||
		statusParam === 'failed'
			? statusParam
			: undefined;
	const limit = parseLimit(url.searchParams.get('limit'));

	const posts = await locals.socialPostService.list({ status, limit });
	const serialized = posts.map((post) => ({
		...post,
		createdAt: post.createdAt.toISOString(),
		updatedAt: post.updatedAt.toISOString(),
		approvedAt: post.approvedAt?.toISOString() ?? null,
		publishedAt: post.publishedAt?.toISOString() ?? null,
		builtLinkUrl: locals.socialPostService.buildFinalUrl(post)
	}));

	return json({ posts: serialized, limit });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const parsed = adminCreateSocialPostSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'Invalid social post payload' }, { status: 400 });
	}

	try {
		const post = await locals.socialPostService.createDraft({
			body: parsed.data.body,
			linkUrl: parsed.data.linkUrl ?? null,
			title: parsed.data.title ?? null,
			utmSource: parsed.data.utmSource ?? null,
			utmMedium: parsed.data.utmMedium ?? null,
			utmCampaign: parsed.data.utmCampaign ?? null,
			utmContent: parsed.data.utmContent ?? null,
			source: parsed.data.source ?? 'agent'
		});

		return json(
			{
				id: post.id,
				status: post.status,
				builtLinkUrl: locals.socialPostService.buildFinalUrl(post)
			},
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof SocialPostError) {
			return json({ error: error.message }, { status: 400 });
		}
		throw error;
	}
};
