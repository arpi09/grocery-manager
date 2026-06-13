import type { LearningFeedbackPort } from '$lib/application/learning/ports/learning-feedback.port';
import type { ILearningFeedbackRepository } from '$lib/infrastructure/repositories/learning-feedback.repository';

export class LearningFeedbackAdapter implements LearningFeedbackPort {
	constructor(private readonly repository: ILearningFeedbackRepository) {}

	async insert(input: Parameters<LearningFeedbackPort['insert']>[0]): Promise<void> {
		await this.repository.insert(input);
	}
}
