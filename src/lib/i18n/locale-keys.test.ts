import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import sv from './locales/sv.json';

function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
	const keys: string[] = [];
	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === 'object') {
			keys.push(...leafKeys(value as Record<string, unknown>, path));
		} else {
			keys.push(path);
		}
	}
	return keys;
}

describe('locale catalogs', () => {
	it('en.json has every key from sv.json', () => {
		const svKeys = leafKeys(sv).sort();
		const enKeys = new Set(leafKeys(en));
		const missing = svKeys.filter((k) => !enKeys.has(k));
		expect(missing).toEqual([]);
	});

	it('sv.json has every key from en.json', () => {
		const enKeys = leafKeys(en).sort();
		const svKeySet = new Set(leafKeys(sv));
		const missing = enKeys.filter((k) => !svKeySet.has(k));
		expect(missing).toEqual([]);
	});
});
