import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShoppingListReadOnlyError, ShoppingListService } from './shopping-list.service';
import type { IShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
describe('ShoppingListService', () => {
  let repository: IShoppingListRepository;
  let service: ShoppingListService;
  beforeEach(() => {
    repository = { listByHousehold: vi.fn(), findById: vi.fn(), create: vi.fn(), setChecked: vi.fn(), delete: vi.fn(), deleteChecked: vi.fn(), nextSortOrder: vi.fn() };
    service = new ShoppingListService(repository);
  });
  it('rejects viewers', async () => {
    await expect(service.addItem('h1', 'viewer', { name: 'X' })).rejects.toBeInstanceOf(ShoppingListReadOnlyError);
  });
});