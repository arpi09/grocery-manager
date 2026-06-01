import { describe, expect, it } from 'vitest';
import { guessStorageLocation } from './guess-storage-location';

describe('guessStorageLocation', () => {
	it('sends ready meals to fridge', () => {
		expect(guessStorageLocation('Pasta Bolognese')).toBe('fridge');
		expect(guessStorageLocation('ICA Färdigrätt Lasagne')).toBe('fridge');
	});

	it('keeps dry goods in cupboard', () => {
		expect(guessStorageLocation('Basmatiris 2kg')).toBe('cupboard');
		expect(guessStorageLocation('Spaghetti')).toBe('cupboard');
	});

	it('sends frozen items to freezer', () => {
		expect(guessStorageLocation('Frysta ärtor')).toBe('freezer');
		expect(guessStorageLocation('Djupfryst kyckling')).toBe('freezer');
	});

	it('sends dairy to fridge', () => {
		expect(guessStorageLocation('Mjölk 3%')).toBe('fridge');
		expect(guessStorageLocation('Goudaost')).toBe('fridge');
	});
});
