import { describe, expect, it } from 'vitest';
import {
	APP_HOME_PATH,
	PANTRY_CREATE_ACTION,
	PANTRY_SWITCH_ACTION
} from './app-home';

describe('app-home pantry actions', () => {
	it('targets hem page server actions, not marketing root', () => {
		expect(PANTRY_SWITCH_ACTION).toBe(`${APP_HOME_PATH}?/switchHousehold`);
		expect(PANTRY_CREATE_ACTION).toBe(`${APP_HOME_PATH}?/createHousehold`);
		expect(PANTRY_SWITCH_ACTION).not.toContain('/?/');
	});
});
