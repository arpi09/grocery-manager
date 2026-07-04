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

	it('sends ice cream compounds to freezer', () => {
		expect(guessStorageLocation('Gräddglass Vanilj')).toBe('freezer');
		expect(guessStorageLocation('Tofta persikaglass')).toBe('freezer');
		expect(guessStorageLocation('Toftagubbeglass')).toBe('freezer');
		expect(guessStorageLocation('GB Glass')).toBe('freezer');
		expect(guessStorageLocation('Sorbet hallon')).toBe('freezer');
	});

	it('uses the parse category as tie-breaker when the name says nothing', () => {
		expect(guessStorageLocation('Tofta Gubbe', 'glass')).toBe('freezer');
		expect(guessStorageLocation('Bregott', 'mejeri')).toBe('fridge');
		expect(guessStorageLocation('Chilinötter', 'snacks')).toBe('cupboard');
		expect(guessStorageLocation('Indian Tonic', 'dryck')).toBe('cupboard');
	});

	it('lets the name win over the category', () => {
		expect(guessStorageLocation('Frysta ärtor', 'grönsaker')).toBe('freezer');
		expect(guessStorageLocation('Kaffe', 'glass')).toBe('cupboard');
	});

	it('sends dairy to fridge', () => {
		expect(guessStorageLocation('Mjölk 3%')).toBe('fridge');
		expect(guessStorageLocation('Goudaost')).toBe('fridge');
		expect(guessStorageLocation('GRADDFIL 15%')).toBe('fridge');
		expect(guessStorageLocation('Filmjölk 3%')).toBe('fridge');
	});

	it('classifies common receipt abbreviations', () => {
		expect(guessStorageLocation('KYCKLINGFILE 500G')).toBe('fridge');
		expect(guessStorageLocation('FALUKORV 800G')).toBe('fridge');
		expect(guessStorageLocation('LAX FILE')).toBe('fridge');
		expect(guessStorageLocation('PASTA SPAGHETTI')).toBe('cupboard');
	});
});
