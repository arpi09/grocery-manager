import { error, redirect } from '@sveltejs/kit';
import { guideArticleToGuide } from '$lib/marketing/guides.server';
import { isAdmin } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || !isAdmin(locals.user)) {
		redirect(302, '/login');
	}

	const article = await locals.guideArticleService.get(params.id);
	if (!article) {
		error(404, 'Not found');
	}

	return {
		guide: guideArticleToGuide(article),
		articleStatus: article.status
	};
};
