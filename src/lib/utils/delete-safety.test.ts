import { describe, expect, it } from 'vitest';
import { getDeleteCopy, isTypedConfirmationValid } from './delete-safety';

describe('getDeleteCopy', () => {
	it('returns tier-2 style copy for inventory items', () => {
		const copy = getDeleteCopy(2, 'inventoryItem', { itemName: 'Mjölk' });
		expect(copy.title).toBe('Ta bort Mjölk?');
		expect(copy.confirmLabel).toBe('Ta bort');
		expect(copy.consequence).toBeUndefined();
	});

	it('returns tier-3 consequence for household member removal', () => {
		const copy = getDeleteCopy(3, 'householdMember', { itemName: 'anna@example.com' });
		expect(copy.consequence).toContain('bjudas in');
	});

	it('returns tier-4 typed confirmation hints for household delete', () => {
		const copy = getDeleteCopy(4, 'householdDelete', {
			confirmationTarget: 'Hemmet',
			otherMemberCount: 2
		});
		expect(copy.typedConfirmationHint).toContain('TA BORT');
		expect(copy.consequence).toContain('2 andra medlemmar');
	});

	it('returns tier-4 typed confirmation hints for account delete', () => {
		const copy = getDeleteCopy(4, 'accountDelete', { otherMemberCount: 1 });
		expect(copy.typedConfirmationHint).toContain('RADERA');
		expect(copy.consequence).toContain('1 delat hushåll');
	});

	it('includes undo message for shopping list items', () => {
		const copy = getDeleteCopy(1, 'shoppingListItem', { itemName: 'Ägg' });
		expect(copy.undoToastMessage).toContain('Ägg');
		expect(copy.undoActionLabel).toBe('Ångra');
	});
});

describe('isTypedConfirmationValid', () => {
	it('accepts exact household name', () => {
		expect(isTypedConfirmationValid('Hemmet', 'Hemmet')).toBe(true);
	});

	it('accepts TA BORT', () => {
		expect(isTypedConfirmationValid('TA BORT', 'Hemmet')).toBe(true);
	});

	it('rejects mismatch', () => {
		expect(isTypedConfirmationValid('fel', 'Hemmet')).toBe(false);
	});
});
