import { afterEach, describe, expect, it } from 'vitest';
import {
	canAccessMarketV01Ui,
	configureMarketV01Env,
	isMarketV01BackendEnabled,
	isMarketV01DisabledByEnv,
	showMarketV01InNav
} from './market-v01';

describe('market-v01 access', () => {
	afterEach(() => {
		configureMarketV01Env(() => undefined);
	});

	it('treats MARKET_V01_DISABLED=true as disabled', () => {
		configureMarketV01Env(() => 'true');
		expect(isMarketV01DisabledByEnv()).toBe(true);
		expect(isMarketV01BackendEnabled()).toBe(false);
	});

	it('defaults to backend enabled when env unset', () => {
		expect(isMarketV01DisabledByEnv()).toBe(false);
		expect(isMarketV01BackendEnabled()).toBe(true);
	});

	it('allows admin UI without nearby opt-in', () => {
		expect(canAccessMarketV01Ui({ role: 'admin' }, false)).toBe(true);
	});

	it('requires nearby opt-in for regular users', () => {
		expect(canAccessMarketV01Ui({ role: 'user' }, false)).toBe(false);
		expect(canAccessMarketV01Ui({ role: 'user' }, true)).toBe(true);
	});

	it('shows nav only for admin when backend enabled', () => {
		expect(showMarketV01InNav({ role: 'admin' })).toBe(true);
		expect(showMarketV01InNav({ role: 'user' })).toBe(false);
		expect(showMarketV01InNav(null)).toBe(false);
	});

	it('hides nav when env kill-switch is on', () => {
		configureMarketV01Env(() => '1');
		expect(showMarketV01InNav({ role: 'admin' })).toBe(false);
		expect(canAccessMarketV01Ui({ role: 'admin' }, true)).toBe(false);
	});
});
