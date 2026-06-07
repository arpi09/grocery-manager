import { loadPublishedGuides, toGuideListItem } from '$lib/marketing/guides.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	await parent();
	const guides = loadPublishedGuides().map(toGuideListItem);

	return { guides };
};
