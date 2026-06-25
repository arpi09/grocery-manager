import { afterEach, describe, expect, it } from 'vitest';
import {
	canClaimSessionOverlay,
	claimSessionOverlay,
	getSessionOverlayKind,
	resetSessionOverlayForTests
} from './overlay-stack';

describe('overlay session mutex', () => {
	afterEach(() => {
		resetSessionOverlayForTests();
	});

	it('allows first overlay to claim session', () => {
		expect(canClaimSessionOverlay('hint')).toBe(true);
		claimSessionOverlay('hint');
		expect(getSessionOverlayKind()).toBe('hint');
	});

	it('blocks second overlay kind in same session', () => {
		claimSessionOverlay('onboarding');
		expect(canClaimSessionOverlay('survey')).toBe(false);
		expect(canClaimSessionOverlay('onboarding')).toBe(true);
	});
});
