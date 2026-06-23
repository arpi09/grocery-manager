import { Buffer } from 'node:buffer';
import { json } from '@sveltejs/kit';
import type { PhotoRoundParseResult } from '$lib/domain/photo-round';
import { PHOTO_ROUND_MAX_IMAGE_BYTES, PHOTO_ROUND_MAX_IMAGES } from '$lib/domain/photo-round';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { e2eMockPhotoRoundParse, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { translateOpenAiError, missingOpenAiKeyMessage } from '$lib/server/openai';
import { isPhotoValidationEnabled } from '$lib/server/brain-feature-flags';
import { parsePhotoRoundFromImages, parsePhotoRoundZoneHint } from '$lib/server/photo-round-parse';
import { loadShelfLifePromptFeedbackBlocks } from '$lib/server/receipt-parse-feedback';
import { learningFeedbackRepository } from '$lib/server/di';
import { buildPantryDeltaUserContext } from '$lib/server/pantry-delta-prompt';
import { enrichPhotoRoundShelfLife } from '$lib/server/photo-round-shelf-life';
import { isShelfLifeEstimatesInReceiptEnabled } from '$lib/server/shelf-life-learning-flag';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const formData = await request.formData();
	const zoneHint = parsePhotoRoundZoneHint(formData.get('zone'));
	if (formData.has('zone') && zoneHint === null && formData.get('zone') !== 'auto') {
		const zoneRaw = formData.get('zone');
		if (typeof zoneRaw === 'string' && zoneRaw.trim() && zoneRaw.trim().toLowerCase() !== 'auto') {
			return json({ error: translate(locals.locale, 'errors.api.photoRoundInvalidZone') }, { status: 400 });
		}
	}

	const uploads = formData
		.getAll('images')
		.filter((entry): entry is File => entry instanceof File);

	if (uploads.length === 0) {
		return json({ error: translate(locals.locale, 'errors.api.photoRoundNoImages') }, { status: 400 });
	}

	if (uploads.length > PHOTO_ROUND_MAX_IMAGES) {
		return json(
			{ error: translate(locals.locale, 'errors.api.photoRoundTooManyImages', { max: PHOTO_ROUND_MAX_IMAGES }) },
			{ status: 400 }
		);
	}

	for (const file of uploads) {
		if (!file.type.startsWith('image/')) {
			return json(
				{ error: translate(locals.locale, 'errors.api.photoRoundNotImage') },
				{ status: 400 }
			);
		}
		if (file.size > PHOTO_ROUND_MAX_IMAGE_BYTES) {
			return json(
				{ error: translate(locals.locale, 'errors.api.photoRoundImageTooLarge') },
				{ status: 413 }
			);
		}
	}

	const quotaResponse = await requireAiQuota(locals, 'ai_scan', auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	if (isE2eMockAiEnabled()) {
		const parsed = e2eMockPhotoRoundParse(zoneHint);
		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: locals.householdId,
			eventType: 'photo_round_parsed',
			metadata: {
				itemCount: parsed.items.length,
				zone: parsed.detectedZone,
				zoneConfidence: parsed.zoneConfidence,
				e2eMock: true
			}
		});
		return json(parsed satisfies PhotoRoundParseResult);
	}

	const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'photo inventory round', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		console.error(missingOpenAiKeyMessage('photo inventory round'));
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const imageDataUrls: string[] = [];
	for (const file of uploads) {
		const bytes = await file.arrayBuffer();
		const base64 = Buffer.from(bytes).toString('base64');
		imageDataUrls.push(`data:${file.type};base64,${base64}`);
	}

	const shelfLifeFeedback =
		locals.householdId != null
			? await loadShelfLifePromptFeedbackBlocks(learningFeedbackRepository, locals.householdId)
			: { priorCorrectionsBlock: '', globalFewShotBlock: '' };

	const pantryDelta = formData.get('delta') === '1' || formData.get('delta') === 'true';
	let deltaContext: string | undefined;
	if (pantryDelta && locals.householdId) {
		const inventoryItems = await locals.inventoryService.listAll(locals.householdId);
		deltaContext = buildPantryDeltaUserContext(inventoryItems, zoneHint, uploads.length);
	}

	const aiResult = await parsePhotoRoundFromImages(apiKey, zoneHint, imageDataUrls, {
		validate: isPhotoValidationEnabled(),
		priorCorrectionsBlock: shelfLifeFeedback.priorCorrectionsBlock,
		globalFewShotBlock: shelfLifeFeedback.globalFewShotBlock,
		pantryDelta,
		deltaContext
	});
	if (!aiResult.ok) {
		return json({ error: translateOpenAiError(locals.locale, aiResult) }, { status: aiResult.status });
	}

	let shelfLifePredictions: Awaited<ReturnType<typeof enrichPhotoRoundShelfLife>> | undefined;
	if (isShelfLifeEstimatesInReceiptEnabled() && locals.householdId) {
		shelfLifePredictions = await enrichPhotoRoundShelfLife(
			locals.householdId,
			aiResult.items,
			locals.learningEngineService,
			{ apiKey }
		);
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'photo_round_parsed',
		metadata: {
			itemCount: aiResult.items.length,
			zone: aiResult.detectedZone,
			zoneConfidence: aiResult.zoneConfidence,
			zoneHint: zoneHint ?? undefined,
			imageCount: uploads.length,
			...(pantryDelta ? { pantryDelta: true } : {})
		}
	});

	return json({
		items: aiResult.items,
		detectedZone: aiResult.detectedZone,
		zoneConfidence: aiResult.zoneConfidence,
		...(pantryDelta ? { pantryDelta: true } : {}),
		...(shelfLifePredictions ? { shelfLifePredictions } : {})
	} satisfies PhotoRoundParseResult & { pantryDelta?: boolean });
};
