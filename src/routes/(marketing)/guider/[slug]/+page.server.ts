import { error } from '@sveltejs/kit';
import { loadGuideBySlug } from '$lib/marketing/guides.server';
import { pmfService } from '$lib/server/di';
import { recordGuideViewEvent } from '$lib/server/marketing-analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, parent, locals }) => {
	await parent();
	const guide = loadGuideBySlug(params.slug);
	if (!guide) {
		error(404, 'Not found');
	}

	recordGuideViewEvent({
		pmfService,
		cookies,
		slug: guide.slug,
		userId: locals.user?.id ?? null
	});

	return { guide };
};
