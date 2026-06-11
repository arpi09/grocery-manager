import { json } from '@sveltejs/kit';
import {
	extractPurchasedAtFromReceiptText,
	extractStoreFromReceiptText
} from '$lib/domain/receipt-store';
import {
	isAllowedKivraForwardSender,
	parseForwardTokenFromRecipients
} from '$lib/domain/kivra-forward';
import type { ReceiptLine } from '$lib/domain/receipt-line';
import { getOpenAiApiKey } from '$lib/server/openai';
import { extractPdfText } from '$lib/server/receipt-pdf';
import { parseReceiptFromText, parseReceiptLines } from '$lib/server/receipt-parse';
import { importReceiptLines } from '$lib/server/receipt-import';
import { isKivraForwardEnabled } from '$lib/server/kivra-forward';
import {
	downloadAttachmentBytes,
	listInboundPdfAttachments,
	verifyResendWebhook,
	type ResendEmailReceivedEvent
} from '$lib/server/resend-inbound';
import {
	householdService,
	inventoryService,
	pmfService,
	purchasePatternService,
	receiptForwardService
} from '$lib/server/di';
import { recordAppError } from '$lib/server/error-log/record';
import type { RequestHandler } from './$types';

function isEmailReceivedEvent(event: unknown): event is ResendEmailReceivedEvent {
	if (!event || typeof event !== 'object') return false;
	const typed = event as ResendEmailReceivedEvent;
	return typed.type === 'email.received' && typeof typed.data?.email_id === 'string';
}

export const POST: RequestHandler = async ({ request }) => {
	if (!isKivraForwardEnabled()) {
		return json({ ok: false, error: 'Kivra forward is disabled' }, { status: 404 });
	}

	const payload = await request.text();
	const verified = verifyResendWebhook(payload, {
		svixId: request.headers.get('svix-id'),
		svixTimestamp: request.headers.get('svix-timestamp'),
		svixSignature: request.headers.get('svix-signature')
	});

	if ('error' in verified) {
		console.warn(`[kivra-forward] webhook rejected: ${verified.error}`);
		return json({ ok: false, error: 'Invalid webhook signature' }, { status: 401 });
	}

	if (!isEmailReceivedEvent(verified)) {
		return json({ ok: true, skipped: true });
	}

	const data = verified.data as ResendEmailReceivedEvent['data'] & {
		cc?: string[];
		bcc?: string[];
	};
	const recipients = [...(data.to ?? []), ...(data.cc ?? []), ...(data.bcc ?? [])];
	const token = parseForwardTokenFromRecipients(recipients);
	if (!token) {
		console.warn('[kivra-forward] no kvitto+ token in recipients');
		return json({ ok: false, error: 'Unknown recipient' }, { status: 422 });
	}

	if (!isAllowedKivraForwardSender(verified.data.from)) {
		console.warn(`[kivra-forward] sender not allowlisted: ${verified.data.from}`);
		return json({ ok: false, error: 'Sender not allowed' }, { status: 403 });
	}

	const householdId = await receiptForwardService.resolveHouseholdId(token);
	if (!householdId) {
		console.warn('[kivra-forward] token did not match a household');
		return json({ ok: false, error: 'Unknown household token' }, { status: 404 });
	}

	const ownerUserId = await householdService.findPrimaryOwnerUserId(householdId);
	if (!ownerUserId) {
		console.error(`[kivra-forward] household ${householdId} has no owner`);
		return json({ ok: false, error: 'Household not ready' }, { status: 422 });
	}

	try {
		const attachments = await listInboundPdfAttachments(verified.data.email_id);
		if (attachments.length === 0) {
			console.warn(`[kivra-forward] no PDF attachment for email ${verified.data.email_id}`);
			return json({ ok: false, error: 'No PDF attachment' }, { status: 422 });
		}

		const apiKey = getOpenAiApiKey();
		if (!apiKey) {
			return json({ ok: false, error: 'AI not configured' }, { status: 503 });
		}

		let parsedLines: ReceiptLine[] = [];
		let parsedStoreLabel: string | undefined;
		let parsedPurchasedAt: Date | undefined;
		for (const attachment of attachments) {
			const bytes = await downloadAttachmentBytes(attachment.downloadUrl);
			const pdfText = await extractPdfText(bytes);
			if (!pdfText.ok) {
				continue;
			}
			parsedStoreLabel = extractStoreFromReceiptText(pdfText.text);
			parsedPurchasedAt = extractPurchasedAtFromReceiptText(pdfText.text);

			const aiResult = await parseReceiptFromText(apiKey, pdfText.text);
			if (!aiResult.ok) {
				continue;
			}

			const lines = parseReceiptLines(aiResult.data);
			if (lines.length > 0) {
				parsedLines = lines;
				break;
			}
		}

		if (parsedLines.length === 0) {
			await recordAppError({
				error: new Error('Could not parse forwarded receipt PDF'),
				path: '/api/inbound/kivra',
				statusCode: 422
			});
			return json({ ok: false, error: 'Could not parse receipt' }, { status: 422 });
		}

		const result = await importReceiptLines({
			householdId,
			userId: ownerUserId,
			role: 'owner',
			lines: parsedLines,
			inventoryService,
			purchasePatternService,
			pmfService,
			eventType: 'kivra_forward_received',
			source: 'kivra_forward',
			storeLabel: parsedStoreLabel ?? null,
			purchasedAt: parsedPurchasedAt ?? null
		});

		console.info(
			`[kivra-forward] imported ${result.itemsAdded} items for household ${householdId}`
		);

		return json({ ok: true, itemsAdded: result.itemsAdded });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Inbound processing failed';
		console.error(`[kivra-forward] processing failed: ${message}`);
		await recordAppError({
			error: error instanceof Error ? error : new Error(message),
			path: '/api/inbound/kivra',
			statusCode: 500
		});
		return json({ ok: false, error: 'Processing failed' }, { status: 500 });
	}
};
