// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import {
	buildExpiringShareCardRows,
	renderExpiringShareCardPng,
	type ExpiringShareExportLabels
} from './expiring-share-export';

describe('buildExpiringShareCardRows', () => {
	it('sorts by expiry date and caps visible rows', () => {
		const items = [
			{ name: 'Yoghurt', expiresOn: '2026-06-12' },
			{ name: 'Mjölk', expiresOn: '2026-06-10' },
			{ name: 'Ost', expiresOn: '2026-06-11' }
		];

		const { rows, overflowCount } = buildExpiringShareCardRows(items, 'sv', 2);

		expect(rows).toHaveLength(2);
		expect(rows[0]?.name).toBe('Mjölk');
		expect(rows[1]?.name).toBe('Ost');
		expect(overflowCount).toBe(1);
	});

	it('formats dates for locale', () => {
		const { rows } = buildExpiringShareCardRows(
			[{ name: 'Milk', expiresOn: '2026-06-10' }],
			'en'
		);

		expect(rows[0]?.dateLabel).toMatch(/10 Jun 2026/);
	});
});

describe('renderExpiringShareCardPng', () => {
	it('returns a PNG blob when canvas 2d is available', async () => {
		const canvas = document.createElement('canvas');
		if (!canvas.getContext('2d')) {
			return;
		}

		const labels: ExpiringShareExportLabels = {
			brand: 'Skaffu',
			badge: 'Expiring soon',
			headline: 'Eat it first this week',
			items: [
				{ name: 'Milk', dateLabel: '10 Jun 2026' },
				{ name: 'Yoghurt', dateLabel: '12 Jun 2026' }
			],
			overflowText: '+ 3 more',
			footer: 'Less food waste with Skaffu.'
		};

		const blob = await renderExpiringShareCardPng(labels);

		expect(blob.type).toBe('image/png');
		expect(blob.size).toBeGreaterThan(0);
	});
});
