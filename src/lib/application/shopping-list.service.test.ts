import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShoppingListReadOnlyError, ShoppingListService } from './shopping-list.service';
import type { IShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';

describe('ShoppingListService', () => {
	let repository: IShoppingListRepository;
	let service: ShoppingListService;

	beforeEach(() => {
		repository = {
			listByHousehold: vi.fn(),
			listUncheckedByHousehold: vi.fn(),
			listCheckedByHousehold: vi.fn(),
			countCheckedByHousehold: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			setChecked: vi.fn(),
			delete: vi.fn(),
			deleteChecked: vi.fn(),
			nextSortOrder: vi.fn()
		};
		service = new ShoppingListService(repository);
	});

	it('rejects viewers', async () => {
		await expect(service.addItem('h1', 'viewer', { name: 'X' })).rejects.toBeInstanceOf(
			ShoppingListReadOnlyError
		);
	});

	it('skips duplicate names when adding suggestions', async () => {
		vi.mocked(repository.listByHousehold).mockResolvedValue([
			{
				id: '1',
				householdId: 'h1',
				name: 'Mjölk',
				quantity: null,
				unit: null,
				checked: false,
				sortOrder: 0,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		]);
		vi.mocked(repository.nextSortOrder).mockResolvedValue(1);
		vi.mocked(repository.create).mockImplementation(async (householdId, id, input, sortOrder) => ({
			id,
			householdId,
			name: input.name,
			quantity: input.quantity ?? null,
			unit: input.unit ?? null,
			checked: false,
			sortOrder,
			createdAt: new Date(),
			updatedAt: new Date()
		}));

		const result = await service.addSuggestedItems('h1', 'editor', [
			{ name: 'Mjölk', quantity: '1 l' },
			{ name: '  mjölk  ', quantity: '2 l' },
			{ name: 'Bröd', quantity: '1 st' }
		]);

		expect(result).toEqual({ added: 1, skipped: 2 });
		expect(repository.create).toHaveBeenCalledTimes(1);
	});
});