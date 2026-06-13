import { describe, expect, it } from 'vitest';
import {
	APP_HOME_PATH,
	HEM_PATH,
	INKOP_PATH,
	PANTRY_CREATE_ACTION,
	PANTRY_SWITCH_ACTION
} from './app-home';

describe('app-home pantry actions', () => {
	it('targets hem page server actions, not marketing root', () => {
		expect(APP_HOME_PATH).toBe('/hem');
		expect(INKOP_PATH).toBe('/inkop');
		expect(PANTRY_SWITCH_ACTION).toBe(`${HEM_PATH}?/switchHousehold`);
		expect(PANTRY_CREATE_ACTION).toBe(`${HEM_PATH}?/createHousehold`);
		expect(PANTRY_SWITCH_ACTION).not.toContain('/?/');
	});
});
