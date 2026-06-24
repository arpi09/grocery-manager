import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FEATURE_FLAG_ENV } from './feature-flags';
import { getLayoutClientFlagSnapshot } from './layout-client-flags';

describe('layout-client-flags snapshot', () => {
	const envKeys = [
		'PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT',
		...Object.values(FEATURE_FLAG_ENV)
	];
	const original: Record<string, string | undefined> = {};

	beforeEach(() => {
		for (const key of envKeys) {
			original[key] = process.env[key];
			delete process.env[key];
		}
	});

	afterEach(() => {
		for (const key of envKeys) {
			if (original[key] === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = original[key];
			}
		}
	});

	it('returns layout props sent to the client', () => {
		const snapshot = getLayoutClientFlagSnapshot();
		const propNames = snapshot.map((entry) => entry.propName);
		expect(propNames).toContain('brainFeedbackV1Enabled');
		expect(propNames).toContain('shareLinkEnabled');
		expect(snapshot.every((entry) => typeof entry.effective === 'boolean')).toBe(true);
	});

	it('marks PUBLIC shelf-life override as env source when set', () => {
		process.env.PUBLIC_SHELF_LIFE_ESTIMATES_IN_RECEIPT = 'false';
		const entry = getLayoutClientFlagSnapshot().find(
			(row) => row.propName === 'shelfLifeEstimatesInReceipt'
		);
		expect(entry?.source).toBe('env');
		expect(entry?.effective).toBe(false);
	});
});
