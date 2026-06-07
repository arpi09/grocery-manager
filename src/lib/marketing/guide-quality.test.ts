import { describe, expect, it } from 'vitest';
import { GUIDE_FORBIDDEN_PHRASES, validateGuideQuality } from '$lib/marketing/guide-quality';

const LONG_BODY = `${'ord '.repeat(850)}[Prova Skaffu gratis](/register).`;

describe('validateGuideQuality', () => {
	it('rejects short articles', () => {
		const result = validateGuideQuality({
			title: 'Test',
			description: 'En beskrivning som är tillräckligt lång för att passera grinden.',
			body: 'Kort text utan länk.'
		});
		expect(result.ok).toBe(false);
		expect(result.errors.some((e) => e.includes('800'))).toBe(true);
	});

	it('requires internal link', () => {
		const result = validateGuideQuality({
			title: 'Test',
			description: 'En beskrivning som är tillräckligt lång för att passera grinden.',
			body: 'ord '.repeat(850)
		});
		expect(result.ok).toBe(false);
		expect(result.errors.some((e) => e.includes('/register'))).toBe(true);
	});

	it('passes valid draft', () => {
		const result = validateGuideQuality({
			title: 'Minska matsvinn',
			description: 'Så minskar du matsvinn hemma med skafferi-app och utgångsdatum i kylskåpet.',
			body: LONG_BODY
		});
		expect(result.ok).toBe(true);
	});

	it('rejects conspiracy-adjacent and medical claim phrases', () => {
		for (const phrase of ['konspiration', 'dold sanning', 'botar cancer'] as const) {
			expect(GUIDE_FORBIDDEN_PHRASES).toContain(phrase);
			const result = validateGuideQuality({
				title: 'Test',
				description: 'En beskrivning som är tillräckligt lång för att passera grinden.',
				body: `${'ord '.repeat(840)} ${phrase} [länk](/register).`
			});
			expect(result.ok).toBe(false);
			expect(result.errors.some((e) => e.includes(phrase))).toBe(true);
		}
	});
});
