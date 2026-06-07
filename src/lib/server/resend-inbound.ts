import { Resend } from 'resend';
import { getResendApiKey } from '$lib/server/email';
import { env } from '$env/dynamic/private';

interface InboundAttachmentMeta {
	id: string;
	filename: string;
	content_type: string;
	download_url: string;
}

type ResendInboundClient = {
	webhooks: {
		verify: (input: {
			payload: string;
			headers: Record<string, string>;
			secret: string;
		}) => ResendEmailReceivedEvent;
	};
	emails: {
		receiving: {
			attachments: {
				list: (input: { emailId: string }) => Promise<{
					data: InboundAttachmentMeta[] | null;
					error: { message: string } | null;
				}>;
			};
		};
	};
};

function createResendInboundClient(apiKey: string): ResendInboundClient {
	return new Resend(apiKey) as unknown as ResendInboundClient;
}

export interface ResendInboundAttachment {
	id: string;
	filename: string;
	contentType: string;
	downloadUrl: string;
}

export interface ResendEmailReceivedEvent {
	type: 'email.received';
	data: {
		email_id: string;
		from: string;
		to: string[];
		subject?: string;
		attachments?: Array<{
			id: string;
			filename: string;
			content_type: string;
		}>;
	};
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
): ResendEmailReceivedEvent | { error: string } {
	const secret = getResendWebhookSecret();
	if (!secret) {
		console.warn('[kivra-forward] RESEND_WEBHOOK_SECRET missing — accepting webhook in stub mode');
		try {
			return JSON.parse(payload) as ResendEmailReceivedEvent;
		} catch {
			return { error: 'Invalid webhook payload' };
		}
	}

	const apiKey = getResendApiKey();
	if (!apiKey) {
		return { error: 'RESEND_API_KEY is not configured' };
	}

	const resend = createResendInboundClient(apiKey);
	try {
		const event = resend.webhooks.verify({
			payload,
			headers: {
				'svix-id': headers.svixId ?? '',
				'svix-timestamp': headers.svixTimestamp ?? '',
				'svix-signature': headers.svixSignature ?? ''
			},
			secret
		});
		return event as ResendEmailReceivedEvent;
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

	const resend = createResendInboundClient(apiKey);
	const { data, error } = await resend.emails.receiving.attachments.list({ emailId });
	if (error) {
		throw new Error(error.message);
	}

	return (data ?? [])
		.filter((attachment: InboundAttachmentMeta) => {
			const type = attachment.content_type?.toLowerCase() ?? '';
			const name = attachment.filename?.toLowerCase() ?? '';
			return type === 'application/pdf' || name.endsWith('.pdf');
		})
		.map((attachment: InboundAttachmentMeta) => ({
			id: attachment.id,
			filename: attachment.filename,
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
