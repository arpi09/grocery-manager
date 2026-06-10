import type { GuideArticleService } from '$lib/application/guide-article.service';
import type { GuideLoaderDeps } from '$lib/marketing/guides.server';

export function guideLoaderDepsFromService(service: GuideArticleService): GuideLoaderDeps {
	return {
		listPublishedFromDb: () => service.listPublished(),
		getPublishedBySlugFromDb: (slug) => service.getPublishedBySlug(slug)
	};
}
