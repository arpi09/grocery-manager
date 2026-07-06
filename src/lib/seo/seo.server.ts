import { getPublishedGuideSitemapEntries } from '$lib/marketing/guides.server';
import type { GuideLoaderDeps } from '$lib/marketing/guides.server';
import { getStoreGuideSitemapEntries } from '$lib/marketing/store-guides';
import { resolveAppOrigin } from '$lib/marketing/app-url';
import { MARKETING_CONTENT_LASTMOD, SITEMAP_ENTRIES, sitemapAbsoluteUrl } from '$lib/seo/seo';

export async function buildSitemapXml(
	requestOrigin?: string,
	guideDeps?: GuideLoaderDeps
): Promise<string> {
	const origin = resolveAppOrigin(requestOrigin);
	const guideEntries = await getPublishedGuideSitemapEntries(guideDeps);
	const allEntries = [...SITEMAP_ENTRIES, ...getStoreGuideSitemapEntries(), ...guideEntries];
	const urls = allEntries.map(
		(entry) => `  <url>
    <loc>${sitemapAbsoluteUrl(entry.path, origin)}</loc>
    <lastmod>${entry.lastmod ?? MARKETING_CONTENT_LASTMOD}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
	).join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
