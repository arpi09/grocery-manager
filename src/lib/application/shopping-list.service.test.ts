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
			setUnavailable: vi.fn(),
			delete: vi.fn(),
			deleteUnchecked: vi.fn(),
			nextSortOrder: vi.fn()
		};
		service = new ShoppingListService(repository);
	});

	it('rejects viewers', async () => {
		await expect(service.addItem('h1', 'viewer', { name: 'X' })).rejects.toBeInstanceOf(
			ShoppingListReadOnlyError
		);
	});

	it('stamps the adding member on create (provenance)', async () => {
		vi.mocked(repository.nextSortOrder).mockResolvedValue(3);
		vi.mocked(repository.create).mockResolvedValue({} as never);

		await service.addItem('h1', 'editor', { name: 'Ost' }, 'user-amanda');

		expect(vi.mocked(repository.create)).toHaveBeenCalledWith(
			'h1',
			expect.any(String),
			{ name: 'Ost' },
			3,
			'user-amanda'
		);
	});

	it('defaults provenance to null when no user is passed', async () => {
		vi.mocked(repository.nextSortOrder).mockResolvedValue(0);
		vi.mocked(repository.create).mockResolvedValue({} as never);

		await service.addItem('h1', 'editor', { name: 'Ost' });

		expect(vi.mocked(repository.create).mock.calls[0][4]).toBeNull();
	});

	it('marks an available item as unavailable', async () => {
		const base = {
			id: '1',
			householdId: 'h1',
			name: 'Dill',
			quantity: null,
			unit: null,
			checked: false,
			unavailableAt: null,
			addedByUserId: null,
			sortOrder: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		vi.mocked(repository.findById).mockResolvedValue(base);
		vi.mocked(repository.setUnavailable).mockImplementation(async (_h, _id, at) => ({
			...base,
			unavailableAt: at
		}));

		const updated = await service.toggleUnavailable('h1', 'editor', '1');
		expect(updated.unavailableAt).toBeInstanceOf(Date);
		expect(vi.mocked(repository.setUnavailable).mock.calls[0][2]).toBeInstanceOf(Date);
	});

	it('clears the unavailable marker on second toggle', async () => {
		const marked = {
			id: '1',
			householdId: 'h1',
			name: 'Dill',
			quantity: null,
			unit: null,
			checked: false,
			unavailableAt: new Date('2026-07-04T10:00:00Z'),
			addedByUserId: null,
			sortOrder: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};
		vi.mocked(repository.findById).mockResolvedValue(marked);
		vi.mocked(repository.setUnavailable).mockImplementation(async (_h, _id, at) => ({
			...marked,
			unavailableAt: at
		}));

		const updated = await service.toggleUnavailable('h1', 'editor', '1');
		expect(updated.unavailableAt).toBeNull();
		expect(vi.mocked(repository.setUnavailable).mock.calls[0][2]).toBeNull();
	});

	it('rejects viewers for unavailable toggles', async () => {
		await expect(service.toggleUnavailable('h1', 'viewer', '1')).rejects.toBeInstanceOf(
			ShoppingListReadOnlyError
		);
	});

	it('clears the unchecked list for editors', async () => {
		vi.mocked(repository.deleteUnchecked).mockResolvedValue(3);
		const removed = await service.clearUnchecked('h1', 'editor');
		expect(removed).toBe(3);
		expect(vi.mocked(repository.deleteUnchecked)).toHaveBeenCalledWith('h1');
	});

	it('rejects viewers clearing the list', async () => {
		await expect(service.clearUnchecked('h1', 'viewer')).rejects.toBeInstanceOf(
			ShoppingListReadOnlyError
		);
		expect(vi.mocked(repository.deleteUnchecked)).not.toHaveBeenCalled();
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
				unavailableAt: null,
				addedByUserId: null,
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
			unavailableAt: null,
			addedByUserId: null,
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