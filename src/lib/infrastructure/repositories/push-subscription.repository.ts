import { and, eq } from 'drizzle-orm';
import { db } from '$lib/infrastructure/db';
import { pushSubscriptionTable, userTable } from '$lib/infrastructure/db/schema';
import { generateId } from '$lib/infrastructure/auth/id';

export interface PushSubscriptionRecord {
	id: string;
	userId: string;
	endpoint: string;
	p256dh: string;
	auth: string;
}

export interface IPushSubscriptionRepository {
	listByUserId(userId: string): Promise<PushSubscriptionRecord[]>;
	upsert(
		userId: string,
		subscription: { endpoint: string; p256dh: string; auth: string }
	): Promise<void>;
	removeByEndpoint(userId: string, endpoint: string): Promise<void>;
	removeAllForUser(userId: string): Promise<void>;
	setPushEnabled(userId: string, enabled: boolean): Promise<void>;
	isPushEnabled(userId: string): Promise<boolean>;
}

export class DrizzlePushSubscriptionRepository implements IPushSubscriptionRepository {
	async listByUserId(userId: string): Promise<PushSubscriptionRecord[]> {
		return db
			.select({
				id: pushSubscriptionTable.id,
				userId: pushSubscriptionTable.userId,
				endpoint: pushSubscriptionTable.endpoint,
				p256dh: pushSubscriptionTable.p256dh,
				auth: pushSubscriptionTable.auth
			})
			.from(pushSubscriptionTable)
			.where(eq(pushSubscriptionTable.userId, userId));
	}

	async upsert(
		userId: string,
		subscription: { endpoint: string; p256dh: string; auth: string }
	): Promise<void> {
		const existing = await db
			.select({ id: pushSubscriptionTable.id })
			.from(pushSubscriptionTable)
			.where(eq(pushSubscriptionTable.endpoint, subscription.endpoint))
			.limit(1);

		if (existing[0]) {
			await db
				.update(pushSubscriptionTable)
				.set({
					userId,
					p256dh: subscription.p256dh,
					auth: subscription.auth
				})
				.where(eq(pushSubscriptionTable.id, existing[0].id));
			return;
		}

		await db.insert(pushSubscriptionTable).values({
			id: generateId(),
			userId,
			endpoint: subscription.endpoint,
			p256dh: subscription.p256dh,
			auth: subscription.auth
		});
	}

	async removeByEndpoint(userId: string, endpoint: string): Promise<void> {
		await db
			.delete(pushSubscriptionTable)
			.where(and(eq(pushSubscriptionTable.userId, userId), eq(pushSubscriptionTable.endpoint, endpoint)));
	}

	async removeAllForUser(userId: string): Promise<void> {
		await db.delete(pushSubscriptionTable).where(eq(pushSubscriptionTable.userId, userId));
	}

	async setPushEnabled(userId: string, enabled: boolean): Promise<void> {
		await db
			.update(userTable)
			.set({ pushNotificationsEnabled: enabled })
			.where(eq(userTable.id, userId));
	}

	async isPushEnabled(userId: string): Promise<boolean> {
		const [row] = await db
			.select({ pushNotificationsEnabled: userTable.pushNotificationsEnabled })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		return Boolean(row?.pushNotificationsEnabled);
	}
}

/** Users opted in to email or browser push expiry reminders. */
export async function deletePushSubscriptionById(id: string): Promise<void> {
	await db.delete(pushSubscriptionTable).where(eq(pushSubscriptionTable.id, id));
}
