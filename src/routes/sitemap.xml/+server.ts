import { buildSitemapXml } from '$lib/seo/seo.server';
import { guideLoaderDepsFromService } from '$lib/marketing/guide-loader-deps';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, locals }) => {
	const xml = await buildSitemapXml(url.origin, guideLoaderDepsFromService(locals.guideArticleService));
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
