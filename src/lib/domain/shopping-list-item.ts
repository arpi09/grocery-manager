export interface ShoppingListItem { id: string; householdId: string; name: string; quantity: string | null; unit: string | null; checked: boolean; sortOrder: number; createdAt: Date; updatedAt: Date; }
export interface CreateShoppingListItemInput { name: string; quantity?: string | null; unit?: string | null; }
