import {
	SHOPPING_LIST_SHARE_TITLE_KEY,
	SHOPPING_LIST_SHARE_TTL_MS,
	type ShoppingListShareItemSnapshot,
	type ShoppingListSharePreview,
	type ShoppingListShareSnapshot
} from '$lib/domain/shopping-list-share';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
import { generateSecureToken, hashSecureToken } from '$lib/infrastructure/auth/secure-token';
import type { IShoppingListShareRepository } from '$lib/infrastructure/repositories/shopping-list-share.repository';

export class ShoppingListShareService {
	constructor(private readonly repository: IShoppingListShareRepository) {}

	buildSnapshot(items: ShoppingListItem[]): ShoppingListShareSnapshot {
		const snapshots: ShoppingListShareItemSnapshot[] = items.map((item) => ({
			name: item.name,
			quantity: item.quantity,
			unit: item.unit,
			checked: item.checked
		}));

		return {
			title: SHOPPING_LIST_SHARE_TITLE_KEY,
			items: snapshots,
			snapshotAt: new Date().toISOString()
		};
	}

	async createShareLink(
		householdId: string,
		userId: string,
		items: ShoppingListItem[]
	): Promise<{
		token: string;
		urlPath: string;
		expiresAt: Date;
		itemCount: number;
	} | null> {
		const snapshot = this.buildSnapshot(items);
		if (snapshot.items.length === 0) {
			return null;
		}

		await this.repository.revokeActiveByHousehold(householdId);

		const token = generateSecureToken();
		const tokenHash = hashSecureToken(token);
		const expiresAt = new Date(Date.now() + SHOPPING_LIST_SHARE_TTL_MS);
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
			urlPath: `/lista/${token}`,
			expiresAt,
			itemCount: snapshot.items.length
		};
	}

	getSharePreview(token: string): Promise<ShoppingListSharePreview | null> {
		return this.repository.findByTokenHash(hashSecureToken(token));
	}
}
