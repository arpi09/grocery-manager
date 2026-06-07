import { Resend, type EmailReceivedEvent, type WebhookEventPayload } from 'resend';
import { getResendApiKey } from '$lib/server/email';
import { env } from '$env/dynamic/private';

export type ResendEmailReceivedEvent = EmailReceivedEvent;

export interface ResendInboundAttachment {
	id: string;
	filename: string;
	contentType: string;
	downloadUrl: string;
}

export function getResendWebhookSecret(): string | null {
	const value = env.RESEND_WEBHOOK_SECRET?.trim();
	return value || null;
}

export function verifyResendWebhook(
	payload: string,
	headers: {
		svixId: string | null;
		svixTimestamp: string | null;
		svixSignature: string | null;
	}
): WebhookEventPayload | { error: string } {
	const secret = getResendWebhookSecret();
	if (!secret) {
		console.warn('[kivra-forward] RESEND_WEBHOOK_SECRET missing — accepting webhook in stub mode');
		try {
			return JSON.parse(payload) as WebhookEventPayload;
		} catch {
			return { error: 'Invalid webhook payload' };
		}
	}

	const apiKey = getResendApiKey();
	if (!apiKey) {
		return { error: 'RESEND_API_KEY is not configured' };
	}

	const resend = new Resend(apiKey);
	try {
		return resend.webhooks.verify({
			payload,
			headers: {
				id: headers.svixId ?? '',
				timestamp: headers.svixTimestamp ?? '',
				signature: headers.svixSignature ?? ''
			},
			webhookSecret: secret
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Webhook verification failed';
		return { error: message };
	}
}

export async function listInboundPdfAttachments(
	emailId: string
): Promise<ResendInboundAttachment[]> {
	const apiKey = getResendApiKey();
	if (!apiKey) {
		throw new Error('RESEND_API_KEY is not configured');
	}

	const resend = new Resend(apiKey);
	const { data, error } = await resend.emails.receiving.attachments.list({ emailId });
	if (error) {
		throw new Error(error.message);
	}

	const attachments = data?.data ?? [];
	return attachments
		.filter((attachment) => {
			const type = attachment.content_type?.toLowerCase() ?? '';
			const name = attachment.filename?.toLowerCase() ?? '';
			return type === 'application/pdf' || name.endsWith('.pdf');
		})
		.map((attachment) => ({
			id: attachment.id,
			filename: attachment.filename ?? 'attachment.pdf',
			contentType: attachment.content_type,
			downloadUrl: attachment.download_url
		}));
}

export async function downloadAttachmentBytes(downloadUrl: string): Promise<Uint8Array> {
	const response = await fetch(downloadUrl);
	if (!response.ok) {
		throw new Error(`Attachment download failed (${response.status})`);
	}
	return new Uint8Array(await response.arrayBuffer());
}
