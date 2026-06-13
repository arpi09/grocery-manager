import type {
	PredictionContext,
	PredictionResult,
	PredictorId
} from '$lib/domain/learning/predictor-types';

export interface Predictor<TSubject, TValue> {
	readonly id: PredictorId;
	predict(
		ctx: PredictionContext,
		subject: TSubject
	): Promise<PredictionResult<TValue> | null>;
}
