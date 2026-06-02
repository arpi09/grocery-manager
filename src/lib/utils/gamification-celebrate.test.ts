import { describe, expect, it } from 'vitest';
import {
	appendCelebration,
	celebrationMessage,
	parseCelebrationKind
} from './gamification-celebrate';

describe('gamification-celebrate', () => {
	it('parses celebration kinds from query params', () => {
		expect(parseCelebrationKind('firstConsumption')).toBe('firstConsumption');
		expect(parseCelebrationKind('unknown')).toBeNull();
	});

	it('appends celebration query param to redirect paths', () => {
		expect(appendCelebration('/hem', 'eatFirstRitual')).toBe('/hem?celebrate=eatFirstRitual');
		expect(appendCelebration('/hem?actionToast=itemFinished', 'firstConsumption')).toBe(
			'/hem?actionToast=itemFinished&celebrate=firstConsumption'
		);
	});

	it('localizes celebration messages', () => {
		expect(celebrationMessage('sv', 'zeroWasteStreak', { count: 3 })).toContain('3');
		expect(celebrationMessage('en', 'firstConsumption')).toContain('First item');
	});
});
