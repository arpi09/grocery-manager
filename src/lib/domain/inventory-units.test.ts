import { describe, expect, it } from 'vitest';
import { suggestUnitForName } from './inventory-units';

describe('suggestUnitForName', () => {
	it('prefers vision hint when valid', () => {
		expect(suggestUnitForName('Unknown product', 'ml')).toBe('ml');
	});

	it('suggests liters for milk-like names', () => {
		expect(suggestUnitForName('Arla Mjölk 3%')).toBe('l');
	});

	it('suggests grams for cheese-like names', () => {
		expect(suggestUnitForName('Gouda ost')).toBe('g');
	});

	it('defaults to st', () => {
		expect(suggestUnitForName('Falukorv')).toBe('st');
	});
});
