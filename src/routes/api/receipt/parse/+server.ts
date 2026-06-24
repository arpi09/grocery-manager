import { Buffer } from 'node:buffer';
import type { ReceiptParseResult } from '$lib/domain/receipt-line';
import { groupReceiptLines } from '$lib/domain/receipt-line-grouping';
import {
	extractPurchasedAtFromReceiptText,
	extractStoreFromReceiptText
} from '$lib/domain/receipt-store';
import { requireOpenAiKey, requireUser } from '$lib/server/api-guards';
import { requireAiQuota } from '$lib/server/ai-rate-limit';
import { e2eMockReceiptParse, isE2eMockAiEnabled } from '$lib/server/e2e-mocks';
import { extractPdfText } from '$lib/server/receipt-pdf';
import {
	extractReceiptTextFromImage,
	parseReceiptFromImage,
	parseReceiptFromText,
	parseReceiptLines,
	shouldReparsedForLowQuality
} from '$lib/server/receipt-parse';
import {
	loadGlobalCorrectedFewShotBlock,
	loadReceiptParseFeedbackContext
} from '$lib/server/receipt-parse-feedback';
import { predictReceiptLinesLocation } from '$lib/server/receipt-location-predictions';
import { predictReceiptLinesShelfLife } from '$lib/server/receipt-shelf-life-predictions';
import { isLocationLearningEnabled } from '$lib/server/feature-flags';
import { isShelfLifeEstimatesInReceiptEnabled } from '$lib/server/shelf-life-learning-flag';
import {
	isReceiptImage,
	isReceiptPdf,
	RECEIPT_MAX_BYTES,
	resolveReceiptMimeType
} from '$lib/utils/receipt-file';
import { json } from '@sveltejs/kit';
import { translate } from '$lib/i18n/messages';
import { recordProductEvent } from '$lib/server/product-events';
import { openAiErrorLogDetail, translateOpenAiError } from '$lib/server/openai';
import { buildReceiptImportQualityReport } from '$lib/domain/receipt-quality-report';
import { PROMPT_VERSION_RECEIPT_PARSE } from '$lib/server/ai-prompt-shared';
import { isReceiptAiBatchEnabled } from '$lib/server/feature-flags';
import { logBrainMetrics, summarizeReceiptParseMetrics } from '$lib/server/brain-metrics';
import {
	householdLocationRuleRepository,
	householdShelfLifeRuleRepository,
	learningFeedbackRepository,
	purchasePatternRepository
} from '$lib/server/di';
import { selectReceiptAutopilotV2Lines } from '$lib/server/receipt-autopilot-v2';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = requireUser(locals);
	if (!auth.authorized) {
		return auth.response;
	}

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

	const usageKind = isReceiptPdf(mimeType) ? 'receipt_pdf' : 'ai_scan';
	const quotaResponse = await requireAiQuota(locals, usageKind, auth.user.id);
	if (quotaResponse) {
		return quotaResponse;
	}

	if (isE2eMockAiEnabled()) {
		const lines = e2eMockReceiptParse();
		const result: ReceiptParseResult = { lines };
		recordProductEvent(locals.pmfService, {
			userId: auth.user.id,
			householdId: locals.householdId,
			eventType: 'receipt_parsed',
			metadata: { lineCount: lines.length, stage: 'parse', e2eMock: true }
		});
		return json(result);
	}

	const apiKeyOrResponse = requireOpenAiKey(locals.locale, 'receipt scan', 503);
	if (typeof apiKeyOrResponse !== 'string') {
		return apiKeyOrResponse;
	}
	const apiKey = apiKeyOrResponse;

	const parseFeedback = locals.householdId
		? await loadReceiptParseFeedbackContext(
				learningFeedbackRepository,
				locals.householdId,
				purchasePatternRepository,
				{
					shelfLifeRules: householdShelfLifeRuleRepository,
					locationRules: householdLocationRuleRepository
				}
			)
		: {
				priorCorrectionsBlock: '',
				globalFewShotBlock: await loadGlobalCorrectedFewShotBlock(),
				householdMemoryBlockOverride: ''
			};

	let aiResult;
	let receiptTextForStoreHeuristic: string | undefined;

	if (isReceiptPdf(mimeType)) {
		const pdfText = await extractPdfText(bytes);
		if (!pdfText.ok) {
			console.warn(`[receipt] PDF text extraction failed: reason=${pdfText.reason}`);
			const errorKey =
				pdfText.reason === 'failed'
					? 'errors.api.receiptPdfExtractFailed'
					: 'errors.api.receiptPdfScanned';
			return json({ error: translate(locals.locale, errorKey) }, { status: 422 });
		}

		receiptTextForStoreHeuristic = pdfText.text;
		const storeHint = extractStoreFromReceiptText(pdfText.text);
		const purchasedAt = extractPurchasedAtFromReceiptText(pdfText.text);
		aiResult = await parseReceiptFromText(
			apiKey,
			pdfText.text,
			storeHint,
			{
				chain: storeHint ?? null,
				storeName: storeHint ?? null,
				purchasedAt: purchasedAt?.toISOString().slice(0, 10) ?? null
			},
			[],
			parseFeedback
		);
	} else {
		const base64 = Buffer.from(bytes).toString('base64');
		const dataUrl = `data:${mimeType};base64,${base64}`;
		receiptTextForStoreHeuristic =
			(await extractReceiptTextFromImage(apiKey, dataUrl)) ?? undefined;
		aiResult = await parseReceiptFromImage(apiKey, dataUrl, undefined, [], parseFeedback);
	}

	if (!aiResult.ok) {
		console.error(
			`[receipt] OpenAI parse failed (${aiResult.status}): ${openAiErrorLogDetail(aiResult).slice(0, 500)}`
		);
		return json(
			{ error: translateOpenAiError(locals.locale, aiResult) },
			{ status: aiResult.status }
		);
	}

	let parsedLines = parseReceiptLines(aiResult.data);
	if (parsedLines.length === 0) {
		console.error(
			'[receipt] Parsed zero lines from AI payload:',
			JSON.stringify(aiResult.data).slice(0, 800)
		);
		return json(
			{ error: translate(locals.locale, 'errors.api.receiptNoItems') },
			{ status: 422 }
		);
	}

	if (shouldReparsedForLowQuality(parsedLines)) {
		const storeHintForReparse = receiptTextForStoreHeuristic
			? extractStoreFromReceiptText(receiptTextForStoreHeuristic)
			: undefined;
		const strictOptions = { ...parseFeedback, strict: true as const };
		const reparsed = isReceiptPdf(mimeType)
			? await parseReceiptFromText(
					apiKey,
					receiptTextForStoreHeuristic!,
					storeHintForReparse,
					undefined,
					[],
					strictOptions
				)
			: await parseReceiptFromImage(
					apiKey,
					`data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`,
					undefined,
					[],
					strictOptions
				);
		if (reparsed.ok) {
			const strictLines = parseReceiptLines(reparsed.data);
			if (strictLines.length > 0) {
				parsedLines = strictLines;
			}
		}
	}

	const { lines, mergedAwayCount } = groupReceiptLines(parsedLines);

	const storeLabel = receiptTextForStoreHeuristic
		? extractStoreFromReceiptText(receiptTextForStoreHeuristic)
		: undefined;
	const purchasedAt = receiptTextForStoreHeuristic
		? extractPurchasedAtFromReceiptText(receiptTextForStoreHeuristic)
		: undefined;
	const purchasedAtIso = purchasedAt?.toISOString() ?? null;
	const result: ReceiptParseResult = { lines, mergedAwayCount };

	if (isShelfLifeEstimatesInReceiptEnabled() && locals.householdId) {
		result.shelfLifePredictions = await predictReceiptLinesShelfLife(
			locals.householdId,
			lines,
			purchasedAtIso,
			locals.learningEngineService,
			{
				apiKey,
				storeLabel: storeLabel ?? null,
				receiptText: receiptTextForStoreHeuristic ?? null,
				shelfLifeRules: householdShelfLifeRuleRepository,
				clearCache: true
			}
		);
	}

	if (result.shelfLifePredictions) {
		result.qualityReport = buildReceiptImportQualityReport(lines, result.shelfLifePredictions);
		const aiBatchUsed = isReceiptAiBatchEnabled();
		logBrainMetrics('receipt_parse', summarizeReceiptParseMetrics({
			lineCount: lines.length,
			bbfCoveragePercent: result.qualityReport.bbfCoveragePercent,
			bbfMissing: result.qualityReport.missing,
			highConfidencePercent: result.qualityReport.highConfidencePercent,
			aiFallbackPercent: result.qualityReport.aiFallbackPercent,
			lowLineConfidenceCount: result.qualityReport.lowLineConfidenceCount,
			aiBatchUsed,
			promptVersion: PROMPT_VERSION_RECEIPT_PARSE
		}));
	}

	recordProductEvent(locals.pmfService, {
		userId: auth.user.id,
		householdId: locals.householdId,
		eventType: 'receipt_parsed',
		metadata: {
			lineCount: lines.length,
			mergedAwayCount,
			stage: 'parse',
			...(result.qualityReport
				? {
						bbfCoveragePercent: result.qualityReport.bbfCoveragePercent,
						bbfMissing: result.qualityReport.missing,
						highConfidencePercent: result.qualityReport.highConfidencePercent,
						aiFallbackPercent: result.qualityReport.aiFallbackPercent,
						lowLineConfidenceCount: result.qualityReport.lowLineConfidenceCount,
						aiBatchUsed: isReceiptAiBatchEnabled()
					}
				: {})
		}
	});

	if (isLocationLearningEnabled() && locals.householdId) {
		result.locationPredictions = await predictReceiptLinesLocation(
			locals.householdId,
			lines,
			locals.learningEngineService
		);
	}

	let autopilotV2Indices: number[] = [];
	if (locals.householdId && result.shelfLifePredictions) {
		const [shelfLifeRules, locationRules] = await Promise.all([
			householdShelfLifeRuleRepository.listByHousehold(locals.householdId, 2),
			householdLocationRuleRepository.listByHousehold(locals.householdId, 2)
		]);
		autopilotV2Indices = selectReceiptAutopilotV2Lines(
			lines,
			result.shelfLifePredictions,
			{ shelfLifeRules, locationRules }
		).map((entry) => entry.index);
	}

	return json({
		...result,
		aiDegradedMode: !isReceiptAiBatchEnabled(),
		...(storeLabel ? { storeLabel } : {}),
		...(purchasedAt ? { purchasedAt: purchasedAtIso } : {}),
		...(autopilotV2Indices.length > 0
			? { autopilotV2: { eligibleIndices: autopilotV2Indices, count: autopilotV2Indices.length } }
			: {})
	});
};
