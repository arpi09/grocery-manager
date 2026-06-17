import { describe, expect, it } from 'vitest';
import { deriveHeroStatus, getHomeHeroTimeBand } from './home-hero';

describe('getHomeHeroTimeBand', () => {
	it('returns morning for 05:00–10:59', () => {
		expect(getHomeHeroTimeBand(new Date('2026-06-17T05:00:00'))).toBe('morning');
		expect(getHomeHeroTimeBand(new Date('2026-06-17T10:59:00'))).toBe('morning');
	});

	it('returns midday for 11:00–16:59', () => {
		expect(getHomeHeroTimeBand(new Date('2026-06-17T11:00:00'))).toBe('midday');
		expect(getHomeHeroTimeBand(new Date('2026-06-17T16:59:00'))).toBe('midday');
	});

	it('returns evening for 17:00–23:59', () => {
		expect(getHomeHeroTimeBand(new Date('2026-06-17T17:00:00'))).toBe('evening');
		expect(getHomeHeroTimeBand(new Date('2026-06-17T23:59:00'))).toBe('evening');
	});

	it('returns night for 00:00–04:59', () => {
		expect(getHomeHeroTimeBand(new Date('2026-06-17T00:00:00'))).toBe('night');
		expect(getHomeHeroTimeBand(new Date('2026-06-17T04:59:00'))).toBe('night');
	});
});

describe('deriveHeroStatus', () => {
	it('maps home states to hero status copy keys', () => {
		expect(deriveHeroStatus('steady')).toBe('healthy');
		expect(deriveHeroStatus('expiry')).toBe('expiring');
		expect(deriveHeroStatus('lista_ready')).toBe('shopping');
		expect(deriveHeroStatus('cold')).toBe('empty');
	});
});
