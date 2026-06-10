import type {
	CreateGuideArticleDraftInput,
	GuideArticle,
	GuideArticleStatus,
	UpdateGuideArticleInput
} from '$lib/domain/guide-article';
import type { IGuideArticleRepository } from '$lib/infrastructure/repositories/guide-article.repository';

export class GuideArticleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GuideArticleError';
	}
}

export class GuideArticleService {
	constructor(private readonly repository: IGuideArticleRepository) {}

	createDraft(input: CreateGuideArticleDraftInput): Promise<GuideArticle> {
		const title = input.title.trim();
		const description = input.description.trim();
		const body = input.body.trim();
		if (!title || !description || !body) {
			return Promise.reject(new GuideArticleError('Guide title, description, and body are required'));
		}
		if (!input.slug.trim()) {
			return Promise.reject(new GuideArticleError('Guide slug is required'));
		}
		return this.repository.createDraft({ ...input, title, description, body });
	}

	list(options?: { status?: GuideArticleStatus; limit?: number }): Promise<GuideArticle[]> {
		return this.repository.list(options);
	}

	listSlugs(): Promise<string[]> {
		return this.repository.listSlugs();
	}

	listPublished(): Promise<GuideArticle[]> {
		return this.repository.listPublished();
	}

	get(id: string): Promise<GuideArticle | null> {
		return this.repository.get(id);
	}

	getBySlug(slug: string): Promise<GuideArticle | null> {
		return this.repository.getBySlug(slug);
	}

	getPublishedBySlug(slug: string): Promise<GuideArticle | null> {
		return this.repository.getBySlug(slug).then((article) => {
			if (!article || article.status !== 'published') {
				return null;
			}
			return article;
		});
	}

	update(id: string, input: UpdateGuideArticleInput): Promise<GuideArticle> {
		if (input.body !== undefined && !input.body.trim()) {
			throw new GuideArticleError('Guide body cannot be empty');
		}
		if (input.title !== undefined && !input.title.trim()) {
			throw new GuideArticleError('Guide title cannot be empty');
		}
		if (input.description !== undefined && !input.description.trim()) {
			throw new GuideArticleError('Guide description cannot be empty');
		}
		return this.repository.update(id, input).then((article) => {
			if (!article) {
				throw new GuideArticleError('Guide not found or cannot be edited');
			}
			return article;
		});
	}

	approve(id: string, approvedBy: string): Promise<GuideArticle> {
		return this.repository.approve(id, approvedBy).then((article) => {
			if (!article) {
				throw new GuideArticleError('Guide not found or cannot be approved');
			}
			return article;
		});
	}

	markPublished(id: string): Promise<GuideArticle> {
		return this.repository.markPublished(id).then((article) => {
			if (!article) {
				throw new GuideArticleError('Guide must be approved before publishing');
			}
			return article;
		});
	}

	assertApprovedForPublish(article: GuideArticle | null): asserts article is GuideArticle {
		if (!article) {
			throw new GuideArticleError('Guide not found');
		}
		if (article.status !== 'approved') {
			throw new GuideArticleError('Only approved guides can be published');
		}
	}
}
