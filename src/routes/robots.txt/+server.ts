import { buildRobotsTxt } from '$lib/seo/seo';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = ({ url }) => {
	const txt = buildRobotsTxt(url.origin);
	return new Response(txt, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
