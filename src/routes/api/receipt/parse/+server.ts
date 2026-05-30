import { Buffer } from 'node:buffer';
import type { ReceiptParseResult } from '$lib/domain/receipt-line';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { extractPdfText } from '$lib/server/receipt-pdf';
import { parseReceiptFromImage, parseReceiptFromText, parseReceiptLines } from '$lib/server/receipt-parse';
import {
	isReceiptImage,
	isReceiptPdf,
	RECEIPT_MAX_BYTES,
	resolveReceiptMimeType
} from '$lib/utils/receipt-file';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { recordProductEvent } from '$lib/server/product-events';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const apiKeyOrResponse = requireOpenAiKey('receipt scan');
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const formData = await request.formData();
	const upload = formData.get('image');
	if (!(upload instanceof File)) {
		return json({ error: translate(locals.locale, 'errors.api.receiptNoFile') }, { status: 400 });
	}

	if (upload.size > RECEIPT_MAX_BYTES) {
		return json({ error: translate(locals.locale, 'errors.api.receiptTooLarge') }, { status: 413 });
	}

	const bytes = new Uint8Array(await upload.arrayBuffer());
	const mimeType = resolveReceiptMimeType(upload.type, upload.name, bytes);

	if (!mimeType || (!isReceiptImage(mimeType) && !isReceiptPdf(mimeType))) {
		return json(
			{ error: translate(locals.locale, 'errors.api.receiptUnsupported') },
			{ status: 400 }
		);
	}

	let aiResult;

	if (isReceiptPdf(mimeType)) {
		const pdfText = await extractPdfText(bytes);
		if (!pdfText.ok) {
			const errorKey =
				pdfText.reason === 'failed'
					? 'errors.api.receiptPdfExtractFailed'
					: 'errors.api.receiptPdfScanned';
			return json({ error: translate(locals.locale, errorKey) }, { status: 422 });
		}

		aiResult = await parseReceiptFromText(apiKey, pdfText.text);
	} else {
		const base64 = Buffer.from(bytes).toString('base64');
		const dataUrl = `data:${mimeType};base64,${base64}`;
		aiResult = await parseReceiptFromImage(apiKey, dataUrl);
	}

	if (!aiResult.ok) {
		return json({ error: aiResult.message }, { status: aiResult.status });
	}

	const lines = parseReceiptLines(aiResult.data);
	if (lines.length === 0) {
		return json(
			{ error: translate(locals.locale, 'errors.api.receiptNoItems') },
			{ status: 422 }
		);
	}

	const result: ReceiptParseResult = { lines };
	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'receipt_parsed',
		metadata: { lineCount: lines.length, stage: 'parse' }
	});
	return json(result);
};
