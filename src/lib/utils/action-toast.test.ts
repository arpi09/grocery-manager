import { describe, expect, it } from 'vitest';
import {
	ACTION_TOAST_LABEL_PARAM,
	ACTION_TOAST_PARAM,
	actionToastMessage,
	actionToastTone,
	appendActionToast,
	parseActionToastKind
} from './action-toast';

describe('action-toast', () => {
	it('parses known toast kinds', () => {
		expect(parseActionToastKind('itemCreated')).toBe('itemCreated');
		expect(parseActionToastKind('unknown')).toBeNull();
		expect(parseActionToastKind(null)).toBeNull();
	});

	it('appends toast params to paths with existing query strings', () => {
		expect(appendActionToast('/inventory/fridge', 'itemCreated', 'Milk')).toBe(
			`/inventory/fridge?${ACTION_TOAST_PARAM}=itemCreated&${ACTION_TOAST_LABEL_PARAM}=Milk`
		);
		expect(appendActionToast('/planer?month=2025-06', 'mealCreated')).toBe(
			`/planer?month=2025-06&${ACTION_TOAST_PARAM}=mealCreated`
		);
	});

	it('formats localized messages with and without labels', () => {
		expect(actionToastMessage('en', 'itemCreated', 'Milk')).toContain('Milk');
		expect(actionToastMessage('en', 'settingsSaved')).toContain('Settings');
		expect(actionToastMessage('sv', 'shoppingAdded')).toContain('inköpslistan');
	});

	it('formats auto-expired clear toast with remaining pantry count', () => {
		expect(actionToastMessage('sv', 'autoExpiredCleared', undefined, '12')).toContain('12');
		expect(actionToastMessage('en', 'autoExpiredCleared', undefined, '5')).toContain('5');
	});

	it('maps toast kinds to visual tones', () => {
		expect(actionToastTone('itemCreated')).toBe('success');
		expect(actionToastTone('itemDeleted')).toBe('info');
		expect(actionToastTone('shoppingCleared')).toBe('info');
	});
});
