import { normalizeReceiptProductName } from '$lib/domain/purchase-pattern';
import type {
	HouseholdFavoriteProduct,
	IHouseholdFavoriteProductRepository
} from '$lib/infrastructure/repositories/household-favorite-product.repository';

export const MAX_HOUSEHOLD_FAVORITES = 20;

export interface SaveHouseholdFavoriteInput {
	barcode: string;
	displayName: string;
	quantity: string;
	unit?: string | null;
	notes?: string | null;
}

export interface HouseholdFavoriteView {
	normalizedKey: string;
	barcode: string | null;
	displayName: string;
	quantity: string;
	unit: string | null;
	notes: string | null;
	updatedAt: string;
}

export class InvalidHouseholdFavoriteError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidHouseholdFavoriteError';
	}
}

export function normalizeFavoriteBarcode(barcode: string): string {
	return barcode.replace(/\D/g, '');
}

function toView(row: HouseholdFavoriteProduct): HouseholdFavoriteView {
	return {
		normalizedKey: row.normalizedKey,
		barcode: row.barcode,
		displayName: row.displayName,
		quantity: row.quantity,
		unit: row.unit,
		notes: row.notes,
		updatedAt: row.updatedAt.toISOString()
	};
}

export class HouseholdFavoritesService {
	constructor(private readonly repository: IHouseholdFavoriteProductRepository) {}

	async list(householdId: string): Promise<HouseholdFavoriteView[]> {
		const rows = await this.repository.listByHousehold(householdId);
		return rows.map(toView);
	}

	async save(householdId: string, input: SaveHouseholdFavoriteInput): Promise<HouseholdFavoriteView> {
		const barcode = normalizeFavoriteBarcode(input.barcode);
		const displayName = input.displayName.trim();
		if (barcode.length < 8 || !displayName) {
			throw new InvalidHouseholdFavoriteError('Invalid barcode or display name');
		}

		const normalizedKey = normalizeReceiptProductName(displayName);
		if (!normalizedKey) {
			throw new InvalidHouseholdFavoriteError('Invalid display name');
		}

		const existingByBarcode = await this.repository.findByBarcode(householdId, barcode);
		if (existingByBarcode && existingByBarcode.normalizedKey !== normalizedKey) {
			await this.repository.deleteByKey(householdId, existingByBarcode.normalizedKey);
		}

		const existingByKey = await this.repository.findByKey(householdId, normalizedKey);
		if (!existingByKey) {
			const count = await this.repository.countByHousehold(householdId);
			if (count >= MAX_HOUSEHOLD_FAVORITES) {
				await this.repository.deleteOldest(householdId);
			}
		}

		const row = await this.repository.upsert({
			householdId,
			normalizedKey,
			barcode,
			displayName,
			quantity: input.quantity.trim() || '1',
			unit: input.unit?.trim() || null,
			notes: input.notes?.trim() || null
		});

		return toView(row);
	}

	async deleteByBarcode(householdId: string, barcode: string): Promise<boolean> {
		const normalized = normalizeFavoriteBarcode(barcode);
		if (normalized.length < 8) {
			return false;
		}
		return this.repository.deleteByBarcode(householdId, normalized);
	}
}
