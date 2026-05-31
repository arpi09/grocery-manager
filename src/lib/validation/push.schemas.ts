import { z } from 'zod';

export const pushSubscribeSchema = z.object({
	endpoint: z.string().url(),
	keys: z.object({
		p256dh: z.string().min(1),
		auth: z.string().min(1)
	})
});

export const pushUnsubscribeSchema = z.object({
	endpoint: z.string().url()
});

export const updatePushNotificationsSchema = z.object({
	enabled: z.enum(['true', 'false'])
});
