import {
	PRODUCT_FEEDBACK_LIST_DEFAULT,
	PRODUCT_FEEDBACK_LIST_MAX,
	type ProductFeedbackEntry,
	type SubmitProductFeedbackInput
} from '$lib/domain/product-feedback';
import type { IProductFeedbackRepository } from '$lib/infrastructure/repositories/product-feedback.repository';

export class ProductFeedbackService {
	constructor(private readonly repository: IProductFeedbackRepository) {}

	async submit(input: SubmitProductFeedbackInput): Promise<string> {
		return this.repository.submit(input);
	}

	async listRecent(limit = PRODUCT_FEEDBACK_LIST_DEFAULT): Promise<ProductFeedbackEntry[]> {
		const safeLimit = Math.min(
			PRODUCT_FEEDBACK_LIST_MAX,
			Math.max(1, Math.floor(limit))
		);
		return this.repository.listRecent(safeLimit);
	}
}
