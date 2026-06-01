import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryReadOnlyError, InventoryService } from './inventory.service';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import type { InventoryItem } from '$lib/domain/inventory-item';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: 'item-1',
		householdId: 'household-1',
		userId: 'user-1',
		name: 'Milk',
		location: 'fridge',
		quantity: '1',
		unit: 'L',
		expiresOn: '2026-06-01',
		notes: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides
	};
}

describe('InventoryService', () => {
	let repository: IInventoryRepository;
	let service: InventoryService;

	beforeEach(() => {
		repository = {
			findById: vi.fn(),
			findByHouseholdAndLocation: vi.fn(),
			findByHouseholdAndLocationPaginated: vi.fn(),
			countActiveByLocation: vi.fn(),
			countFinishedByLocation: vi.fn(),
			findFinishedByHouseholdAndLocation: vi.fn(),
			findAllByHousehold: vi.fn(),
			findExpiringBefore: vi.fn(),
			countByLocation: vi.fn(),
			getAnalytics: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		};
		service = new InventoryService(repository);
	});

	it('returns dashboard summary with location counts', async () => {
		vi.mocked(repository.countByLocation).mockResolvedValue([
			{ location: 'fridge', count: 2 },
			{ location: 'cupboard', count: 1 }
		]);
		vi.mocked(repository.findExpiringBefore).mockResolvedValue([makeItem()]);

		const summary = await service.getDashboard('household-1');

		expect(summary.totalItems).toBe(3);
		expect(summary.counts.find((c) => c.location === 'freezer')?.count).toBe(0);
		expect(summary.expiringSoon).toHaveLength(1);
	});

	it('lists items by location', async () => {
		const items = [makeItem(), makeItem({ id: 'item-2', name: 'Butter' })];
		vi.mocked(repository.findByHouseholdAndLocation).mockResolvedValue(items);

		const result = await service.listByLocation('household-1', 'fridge');

		expect(result).toEqual(items);
		expect(repository.findByHouseholdAndLocation).toHaveBeenCalledWith('household-1', 'fridge');
	});

	it('lists all items for household', async () => {
		const items = [makeItem()];
		vi.mocked(repository.findAllByHousehold).mockResolvedValue(items);

		const result = await service.listAll('household-1');

		expect(result).toEqual(items);
	});

	it('returns item when found', async () => {
		const item = makeItem();
		vi.mocked(repository.findById).mockResolvedValue(item);

		const result = await service.getItem('household-1', 'item-1');

		expect(result).toEqual(item);
	});

	it('updates an item', async () => {
		const updated = makeItem({ name: 'Oat milk' });
		vi.mocked(repository.update).mockResolvedValue(updated);

		const result = await service.updateItem(
			'household-1',
			'item-1',
			{ name: 'Oat milk' },
			'owner'
		);

		expect(result.name).toBe('Oat milk');
		expect(repository.update).toHaveBeenCalledWith('household-1', 'item-1', { name: 'Oat milk' });
	});

	it('deletes an item', async () => {
		vi.mocked(repository.delete).mockResolvedValue(true);

		await service.deleteItem('household-1', 'item-1', 'editor');

		expect(repository.delete).toHaveBeenCalledWith('household-1', 'item-1');
	});

	it('creates an item with generated id via repository', async () => {
		const created = makeItem({ name: 'Sugar', location: 'cupboard' });
		vi.mocked(repository.create).mockResolvedValue(created);

		const result = await service.createItem(
			'household-1',
			'user-1',
			{
				name: 'Sugar',
				location: 'cupboard',
				quantity: '1'
			},
			'editor'
		);

		expect(result.name).toBe('Sugar');
		expect(repository.create).toHaveBeenCalledWith(
			'household-1',
			'user-1',
			expect.any(String),
			expect.objectContaining({ name: 'Sugar', location: 'cupboard' })
		);
	});

	it('rejects create for viewer role', async () => {
		await expect(
			service.createItem(
				'household-1',
				'user-1',
				{ name: 'Sugar', location: 'cupboard', quantity: '1' },
				'viewer'
			)
		).rejects.toBeInstanceOf(InventoryReadOnlyError);

		expect(repository.create).not.toHaveBeenCalled();
	});

	it('rejects update for viewer role', async () => {
		await expect(
			service.updateItem('household-1', 'item-1', { name: 'Blocked' }, 'viewer')
		).rejects.toBeInstanceOf(InventoryReadOnlyError);

		expect(repository.update).not.toHaveBeenCalled();
	});

	it('rejects delete for viewer role', async () => {
		await expect(service.deleteItem('household-1', 'item-1', 'viewer')).rejects.toBeInstanceOf(
			InventoryReadOnlyError
		);

		expect(repository.delete).not.toHaveBeenCalled();
	});

	it('marks an item as finished by setting quantity to zero', async () => {
		const item = makeItem();
		const finished = makeItem({ quantity: '0' });
		vi.mocked(repository.findById).mockResolvedValue(item);
		vi.mocked(repository.update).mockResolvedValue(finished);

		const result = await service.markAsFinished('household-1', 'item-1', 'editor');

		expect(result.quantity).toBe('0');
		expect(repository.update).toHaveBeenCalledWith('household-1', 'item-1', { quantity: '0' });
	});

	it('rejects mark as finished for viewer role', async () => {
		await expect(service.markAsFinished('household-1', 'item-1', 'viewer')).rejects.toBeInstanceOf(
			InventoryReadOnlyError
		);

		expect(repository.findById).not.toHaveBeenCalled();
	});
});
