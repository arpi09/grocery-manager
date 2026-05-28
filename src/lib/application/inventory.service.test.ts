import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service';
import type { IInventoryRepository } from '$lib/infrastructure/repositories/inventory.repository';
import type { InventoryItem } from '$lib/domain/inventory-item';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
	return {
		id: 'item-1',
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
			findByUserAndLocation: vi.fn(),
			findAllByUser: vi.fn(),
			findExpiringBefore: vi.fn(),
			countByLocation: vi.fn(),
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

		const summary = await service.getDashboard('user-1');

		expect(summary.totalItems).toBe(3);
		expect(summary.counts.find((c) => c.location === 'freezer')?.count).toBe(0);
		expect(summary.expiringSoon).toHaveLength(1);
	});

	it('lists items by location', async () => {
		const items = [makeItem(), makeItem({ id: 'item-2', name: 'Butter' })];
		vi.mocked(repository.findByUserAndLocation).mockResolvedValue(items);

		const result = await service.listByLocation('user-1', 'fridge');

		expect(result).toEqual(items);
		expect(repository.findByUserAndLocation).toHaveBeenCalledWith('user-1', 'fridge');
	});

	it('lists all items for user', async () => {
		const items = [makeItem()];
		vi.mocked(repository.findAllByUser).mockResolvedValue(items);

		const result = await service.listAll('user-1');

		expect(result).toEqual(items);
	});

	it('returns item when found', async () => {
		const item = makeItem();
		vi.mocked(repository.findById).mockResolvedValue(item);

		const result = await service.getItem('user-1', 'item-1');

		expect(result).toEqual(item);
	});

	it('updates an item', async () => {
		const updated = makeItem({ name: 'Oat milk' });
		vi.mocked(repository.update).mockResolvedValue(updated);

		const result = await service.updateItem('user-1', 'item-1', { name: 'Oat milk' });

		expect(result.name).toBe('Oat milk');
		expect(repository.update).toHaveBeenCalledWith('user-1', 'item-1', { name: 'Oat milk' });
	});

	it('deletes an item', async () => {
		vi.mocked(repository.delete).mockResolvedValue(true);

		await service.deleteItem('user-1', 'item-1');

		expect(repository.delete).toHaveBeenCalledWith('user-1', 'item-1');
	});

	it('creates an item with generated id via repository', async () => {
		const created = makeItem({ name: 'Sugar', location: 'cupboard' });
		vi.mocked(repository.create).mockResolvedValue(created);

		const result = await service.createItem('user-1', {
			name: 'Sugar',
			location: 'cupboard',
			quantity: '1'
		});

		expect(result.name).toBe('Sugar');
		expect(repository.create).toHaveBeenCalledWith(
			'user-1',
			expect.any(String),
			expect.objectContaining({ name: 'Sugar', location: 'cupboard' })
		);
	});
});
