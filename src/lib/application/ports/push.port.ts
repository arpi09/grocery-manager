export interface PushPayload {
	title: string;
	body: string;
	url?: string;
	tag?: string;
}

export type SendPushFailure = { ok: false; reason: string; statusCode?: number };
export type SendPushResult = { ok: true; delivered: number } | SendPushFailure;

export interface PushPort {
	sendNotification(
		subscription: { endpoint: string; p256dh: string; auth: string },
		payload: PushPayload
	): Promise<SendPushResult>;
}
