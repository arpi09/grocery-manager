import { json } from '@sveltejs/kit';
import { generateMarketingCampaign } from '$lib/marketing/generate-guide-article.server';
import { requireAdmin } from '$lib/server/api-guards';
import { getOpenAiApiKey, missingOpenAiKeyMessage } from '$lib/server/openai';
import { translate } from '$lib/i18n/messages';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const auth = requireAdmin(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKey = getOpenAiApiKey();
	if (!apiKey) {
		console.warn(missingOpenAiKeyMessage('marketing campaign generation'));
		return json(
			{ error: translate(locals.locale, 'errors.api.openAiNotConfigured') },
			{ status: 503 }
		);
	}

	const result = await generateMarketingCampaign({
		apiKey,
		guideArticleService: locals.guideArticleService,
		socialPostService: locals.socialPostService
	});

	if (!result.ok) {
		if (result.error === 'queue_empty') {
			return json(
				{ error: translate(locals.locale, 'admin.marketingCampaigns.queueEmpty') },
				{ status: 409 }
			);
		}
		if (result.error === 'slug_conflict') {
			return json({ error: 'Guide slug already exists' }, { status: 409 });
		}
		console.warn('[marketing-campaigns/generate]', result.error, result.detail ?? '');
		return json(
			{ error: translate(locals.locale, 'admin.marketingCampaigns.generateFailed') },
			{ status: 502 }
		);
	}

	const { guide, socialPost } = result;
	return json(
		{
			guideId: guide.id,
			socialPostId: socialPost.id,
			slug: guide.slug,
			qualityWarnings: guide.qualityWarnings,
			builtLinkUrl: locals.socialPostService.buildFinalUrl(socialPost)
		},
		{ status: 201 }
	);
};
