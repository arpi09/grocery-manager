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

	it('throws when item is not found', async () => {
		vi.mocked(repository.findById).mockResolvedValue(null);

		await expect(service.getItem('user-1', 'missing')).rejects.toThrow('Item not found');
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
