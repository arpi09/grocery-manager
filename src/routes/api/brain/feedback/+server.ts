import { json } from '@sveltejs/kit';
import type { ReplenishmentReasonCode } from '$lib/domain/replenishment';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import { isBrainFeedbackV1Enabled } from '$lib/server/brain-feedback-flag';
import { isReplenishmentLearningEnabled } from '$lib/server/feature-flags';
import { learningFeedbackRepository } from '$lib/server/di';
import { requireInventoryWriteAccess } from '$lib/server/household-auth';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

const FEEDBACK_DEDUPE_MS = 24 * 60 * 60 * 1000;

interface FeedbackBody {
	predictorId?: string;
	subjectKey?: string;
	polarity?: 'positive' | 'negative';
	surface?: 'hem' | 'inkop';
	reasonCode?: ReplenishmentReasonCode;
	suggestionContext?: Record<string, unknown>;
}

function parseBody(body: unknown): FeedbackBody | null {
	if (!body || typeof body !== 'object') return null;
	const raw = body as FeedbackBody;
	if (raw.predictorId !== 'replenishment') return null;
	if (typeof raw.subjectKey !== 'string' || !raw.subjectKey.trim()) return null;
	if (raw.polarity !== 'positive' && raw.polarity !== 'negative') return null;
	return {
		predictorId: raw.predictorId,
		subjectKey: raw.subjectKey.trim(),
		polarity: raw.polarity,
		surface: raw.surface === 'hem' || raw.surface === 'inkop' ? raw.surface : undefined,
		reasonCode: raw.reasonCode,
		suggestionContext: raw.suggestionContext
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!isBrainFeedbackV1Enabled() || !isReplenishmentLearningEnabled()) {
		return json({ error: 'Feature disabled' }, { status: 404 });
	}

	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	try {
		requireInventoryWriteAccess(locals.householdRole);
	} catch {
		return json({ error: translate(locals.locale, 'errors.household.forbidden') }, { status: 403 });
	}

	const parsed = parseBody(await request.json().catch(() => null));
	if (!parsed?.subjectKey) {
		return json({ error: 'Invalid feedback payload' }, { status: 400 });
	}

	const feedbackType = parsed.polarity === 'positive' ? 'accepted' : 'rejected';
	const ackKey =
		parsed.polarity === 'positive' ? 'replenishment.feedback.ackPositive' : 'replenishment.feedback.ackNegative';

	const duplicate = await learningFeedbackRepository.hasRecentFeedback(
		auth.householdId,
		{
			predictorId: 'replenishment',
			subjectKey: parsed.subjectKey,
			feedbackType
		},
		FEEDBACK_DEDUPE_MS
	);

	if (!duplicate) {
		await locals.learningEngineService.recordPredictorFeedback({
			householdId: auth.householdId,
			userId: auth.user.id,
			predictorId: 'replenishment',
			normalizedKey: parsed.subjectKey,
			feedbackType,
			predictedValue: parsed.subjectKey,
			contextJson: {
				...(parsed.suggestionContext ?? {}),
				...(parsed.reasonCode ? { reasonCode: parsed.reasonCode } : {}),
				...(parsed.surface ? { surface: parsed.surface } : {}),
				source: 'brain_feedback_v1'
			}
		});
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: auth.householdId,
		eventType: parsed.polarity === 'positive' ? 'brain_feedback_positive' : 'brain_feedback_negative',
		metadata: {
			predictorId: 'replenishment',
			normalizedKey: parsed.subjectKey,
			...(parsed.reasonCode ? { reasonCode: parsed.reasonCode } : {}),
			...(parsed.surface ? { surface: parsed.surface } : {})
		}
	});

	return json({ ok: true, ackKey, duplicate });
};
