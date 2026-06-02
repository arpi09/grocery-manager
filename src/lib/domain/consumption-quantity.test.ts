import { describe, expect, it } from 'vitest';
import { resolveConsumptionAmount } from './consumption-quantity';

describe('resolveConsumptionAmount', () => {
	it('consumes full stock by default', () => {
		expect(resolveConsumptionAmount({ stockQuantity: '500' })).toEqual({
			ok: true,
			used: 500,
			remaining: 0,
			finished: true
		});
	});

	it('applies lite preset as 10%', () => {
		expect(resolveConsumptionAmount({ stockQuantity: '500', preset: 'lite' })).toEqual({
			ok: true,
			used: 50,
			remaining: 450,
			finished: false
		});
	});

	it('accepts custom amount', () => {
		expect(resolveConsumptionAmount({ stockQuantity: '500', customAmount: '75' })).toEqual({
			ok: true,
			used: 75,
			remaining: 425,
			finished: false
		});
	});
});
