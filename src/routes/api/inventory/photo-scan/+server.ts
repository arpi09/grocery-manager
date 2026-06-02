import { Buffer } from 'node:buffer';
import { json } from '@sveltejs/kit';
import type { PhotoRoundDetectedItem } from '$lib/domain/photo-round';
import { PHOTO_ROUND_MAX_IMAGE_BYTES, PHOTO_ROUND_MAX_IMAGES } from '$lib/domain/photo-round';
import { translate } from '$lib/i18n/messages';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { e2eMockPhotoRoundParse, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { translateOpenAiError, missingOpenAiKeyMessage } from '$lib/server/openai';
import { isPhotoRoundZone, parsePhotoRoundFromImages } from '$lib/server/photo-round-parse';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const formData = await request.formData();
	const zoneRaw = formData.get('zone');
	if (typeof zoneRaw !== 'string' || !isPhotoRoundZone(zoneRaw)) {
		return json({ error: translate(locals.locale, 'errors.api.photoRoundInvalidZone') }, { status: 400 });
	}
	const zone = zoneRaw;

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
		const items = e2eMockPhotoRoundParse(zone);
		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: locals.householdId,
			eventType: 'photo_round_parsed',
			metadata: { itemCount: items.length, zone, e2eMock: true }
		});
		return json({ items } satisfies { items: PhotoRoundDetectedItem[] });
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

	const aiResult = await parsePhotoRoundFromImages(apiKey, zone, imageDataUrls);
	if (!aiResult.ok) {
		return json({ error: translateOpenAiError(locals.locale, aiResult) }, { status: aiResult.status });
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'photo_round_parsed',
		metadata: { itemCount: aiResult.items.length, zone, imageCount: uploads.length }
	});

	return json({ items: aiResult.items } satisfies { items: PhotoRoundDetectedItem[] });
};
