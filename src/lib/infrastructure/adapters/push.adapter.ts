import type { PushPort } from '$lib/application/ports/push.port';
import { sendPushNotification } from '$lib/server/push';

export const pushAdapter: PushPort = {
	sendNotification: sendPushNotification
};
