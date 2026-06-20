import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ShoppingToPantryService } from './shopping-to-pantry.service';
import type { InventoryService } from './inventory.service';
import type { IUserRepository } from '$lib/infrastructure/repositories/user.repository';
import type { InventoryItem } from '$lib/domain/inventory-item';
import type { ShoppingListItem } from '$lib/domain/shopping-list-item';

const shoppingItem: ShoppingListItem = {
	id: 'shop-1',
	householdId: 'hh-1',
	name: 'Mjölk',
	quantity: '2',
	unit: 'L',
	checked: true,
	sortOrder: 1,
	createdAt: new Date(),
	updatedAt: new Date()
};

describe('ShoppingToPantryService', () => {
	let inventoryService: InventoryService;
	let users: IUserRepository;
	let service: ShoppingToPantryService;

	beforeEach(() => {
		inventoryService = {
			listAll: vi.fn(),
			createItem: vi.fn(),
			incrementQuantity: vi.fn()
		} as unknown as InventoryService;
		users = {
			getShoppingToPantryMode: vi.fn(),
			updateShoppingToPantryMode: vi.fn()
		} as unknown as IUserRepository;
		service = new ShoppingToPantryService(inventoryService, users);
	});

	it('previews defaults from last matching inventory item', async () => {
		vi.mocked(inventoryService.listAll).mockResolvedValue([
			{
				id: 'inv-1',
				householdId: 'hh-1',
				userId: 'user-1',
				name: 'Mjölk 1L',
				location: 'fridge',
				quantity: '1',
				unit: 'L',
				expiresOn: null,
				expiresOnSource: null,
				notes: null,
				barcode: null,
				lastConfirmedAt: new Date('2026-06-01'),
				createdAt: new Date('2026-01-01'),
				updatedAt: new Date('2026-06-01')
			} satisfies InventoryItem
		]);

		const preview = await service.previewAdd('hh-1', shoppingItem);

		expect(preview.location).toBe('fridge');
		expect(preview.quantity).toBe('2');
		expect(preview.unit).toBe('L');
		expect(preview.mergeCandidate?.id).toBe('inv-1');
	});

	it('merges into existing row when merge is enabled', async () => {
		const merged = {
			id: 'inv-1',
			householdId: 'hh-1',
			userId: 'user-1',
			name: 'Mjölk',
			location: 'fridge',
			quantity: '3',
			unit: 'L',
			expiresOn: null,
			expiresOnSource: null,
			notes: null,
			barcode: null,
			lastConfirmedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		} satisfies InventoryItem;
		vi.mocked(inventoryService.listAll).mockResolvedValue([merged]);
		vi.mocked(inventoryService.incrementQuantity).mockResolvedValue(merged);

		const result = await service.addFromShopping('hh-1', 'user-1', 'owner', shoppingItem, {
			location: 'fridge',
			quantity: '2',
			unit: 'L',
			merge: true
		});

		expect(result.action).toBe('merged');
		expect(inventoryService.incrementQuantity).toHaveBeenCalledWith(
			'hh-1',
			'inv-1',
			'2',
			'owner'
		);
	});

	it('creates a new row when merge is disabled', async () => {
		const created = {
			id: 'inv-2',
			householdId: 'hh-1',
			userId: 'user-1',
			name: 'Mjölk',
			location: 'fridge',
			quantity: '2',
			unit: 'L',
			expiresOn: '2026-07-01',
			expiresOnSource: 'ai_inferred' as const,
			notes: null,
			barcode: null,
			lastConfirmedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		} satisfies InventoryItem;
		vi.mocked(inventoryService.listAll).mockResolvedValue([]);
		vi.mocked(inventoryService.createItem).mockResolvedValue(created);

		const result = await service.addFromShopping('hh-1', 'user-1', 'owner', shoppingItem, {
			location: 'fridge',
			merge: false
		});

		expect(result.action).toBe('created');
		expect(inventoryService.createItem).toHaveBeenCalled();
	});
});
