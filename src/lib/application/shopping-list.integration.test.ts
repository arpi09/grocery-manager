import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ShoppingListService } from './shopping-list.service';
import { DrizzleShoppingListRepository } from '$lib/infrastructure/repositories/shopping-list.repository';
import { createIntegrationDb, type IntegrationDbContext } from '$lib/test/integration-db';
import { DEFAULT_HOUSEHOLD_ID } from '$lib/infrastructure/db/seed-household';
describe('Household shopping list', () => {
  let integrationDb: IntegrationDbContext;
  let service: ShoppingListService;
  beforeAll(async () => { integrationDb = await createIntegrationDb(); service = new ShoppingListService(new DrizzleShoppingListRepository(integrationDb.db)); });
  beforeEach(async () => { await integrationDb.reset(); });
  afterAll(async () => { await integrationDb.close(); });
  it('stores items per household', async () => {
    await integrationDb.seedUser({ id: 'user-1' });
    await integrationDb.seedHousehold({ id: DEFAULT_HOUSEHOLD_ID, members: [{ userId: 'user-1', role: 'owner' }] });
    await service.addItem(DEFAULT_HOUSEHOLD_ID, 'owner', { name: 'Agg' });
    expect((await service.listItems(DEFAULT_HOUSEHOLD_ID))).toHaveLength(1);
  });
});