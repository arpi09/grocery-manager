import type { LearningFeedbackType } from '$lib/domain/learning/predictor-types';

export interface InsertLearningFeedbackInput {
	householdId: string;
	userId: string;
	predictorId: string;
	subjectKey: string;
	contextJson?: Record<string, unknown>;
	predictedValue: string;
	actualValue?: string | null;
	feedbackType: LearningFeedbackType;
	modelVersion: string;
}

export interface LearningFeedbackPort {
	insert(input: InsertLearningFeedbackInput): Promise<void>;
}
