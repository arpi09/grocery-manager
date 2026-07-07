export interface ShoppingListItem { id: string; householdId: string; name: string; quantity: string | null; unit: string | null; checked: boolean; unavailableAt: Date | null; addedByUserId: string | null; sortOrder: number; createdAt: Date; updatedAt: Date; }
export interface CreateShoppingListItemInput { name: string; quantity?: string | null; unit?: string | null; }
