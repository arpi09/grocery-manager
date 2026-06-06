import { EXPIRING_SOON_DAYS } from '$lib/domain/expiry';
import { filterItemsExpiringWithinDays } from '$lib/domain/expiry-reminder';
import {
	EXPIRING_SHARE_TTL_MS,
	type ExpiringShareItemSnapshot,
	type ExpiringSharePreview,
	type ExpiringShareSnapshot
} from '$lib/domain/expiring-share';
import type { InventoryItem } from '$lib/domain/inventory-item';
import { generateSecureToken, hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';

export class ExpiringShareService {
	constructor(private readonly repository: IExpiringShareRepository) {}

	buildSnapshot(items: InventoryItem[]): ExpiringShareSnapshot {
		const expiringItems = filterItemsExpiringWithinDays(items, EXPIRING_SOON_DAYS);
		const snapshots: ExpiringShareItemSnapshot[] = expiringItems.map((item) => ({
			name: item.name,
			expiresOn: item.expiresOn,
			location: item.location,
			quantity: item.quantity,
			unit: item.unit
		}));

		return {
			items: snapshots,
			createdAt: new Date().toISOString()
		};
	}

	async createShareLink(
		householdId: string,
		userId: string,
		items: InventoryItem[]
	): Promise<{ token: string; urlPath: string; expiresAt: Date; itemCount: number } | null> {
		const snapshot = this.buildSnapshot(items);
		if (snapshot.items.length === 0) {
			return null;
		}

		const token = generateSecureToken();
		const tokenHash = hashSecureToken(token);
		const expiresAt = new Date(Date.now() + EXPIRING_SHARE_TTL_MS);
		const id = crypto.randomUUID();

		await this.repository.create({
			id,
			householdId,
			createdByUserId: userId,
			tokenHash,
			snapshot,
			expiresAt
		});

		return {
			token,
			urlPath: `/dela/${token}`,
			expiresAt,
			itemCount: snapshot.items.length
		};
	}

	getSharePreview(token: string): Promise<ExpiringSharePreview | null> {
		return this.repository.findByTokenHash(hashSecureToken(token));
	}
}
