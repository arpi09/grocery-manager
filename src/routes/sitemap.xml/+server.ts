import { buildSitemapXml } from '$lib/seo/seo';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const xml = buildSitemapXml(url.origin);
	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
