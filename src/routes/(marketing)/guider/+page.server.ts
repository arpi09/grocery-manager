import { loadPublishedGuides, toGuideListItem } from '$lib/marketing/guides.server';
import { guideLoaderDepsFromService } from '$lib/marketing/guide-loader-deps';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	await parent();
	const guides = (await loadPublishedGuides(guideLoaderDepsFromService(locals.guideArticleService))).map(
		toGuideListItem
	);

	return { guides };
};
