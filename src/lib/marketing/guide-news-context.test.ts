import { describe, expect, it, vi } from 'vitest';
import {
	formatNewsContextForPrompt,
	parseRssItems,
	pickRelevantSvtNewsItem,
	resolveGuideNewsContext,
	scoreNewsRelevance,
	type SvtNewsItem
} from '$lib/marketing/guide-news-context';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[Matpriser stiger igen – så sparar hushållen]]></title>
      <link>https://www.svt.se/nyheter/matpriser</link>
      <description><![CDATA[Dagligvaror och livsmedel blir dyrare.]]></description>
      <pubDate>Mon, 01 Jun 2026 08:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Man skjuten i Stockholm</title>
      <link>https://www.svt.se/nyheter/brott</link>
      <description>Polisen utreder skottlossning.</description>
      <pubDate>Mon, 01 Jun 2026 07:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Riksdagen debatterar budget</title>
      <link>https://www.svt.se/nyheter/politik</link>
      <description>Val och politik i fokus.</description>
      <pubDate>Sun, 31 May 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function item(overrides: Partial<SvtNewsItem> & Pick<SvtNewsItem, 'title'>): SvtNewsItem {
	return {
		link: 'https://www.svt.se/nyheter/test',
		description: '',
		pubDate: 'Mon, 01 Jun 2026 08:00:00 GMT',
		...overrides
	};
}

describe('parseRssItems', () => {
	it('extracts titles, links, and descriptions from RSS XML', () => {
		const items = parseRssItems(SAMPLE_RSS);
		expect(items).toHaveLength(3);
		expect(items[0].title).toBe('Matpriser stiger igen – så sparar hushållen');
		expect(items[0].link).toBe('https://www.svt.se/nyheter/matpriser');
		expect(items[0].description).toContain('livsmedel');
	});
});

describe('scoreNewsRelevance', () => {
	it('marks pantry/food headlines as relevant', () => {
		const result = scoreNewsRelevance(
			item({
				title: 'Svenskar kastar mindre matsvinn',
				description: 'Tips för hushåll och kylskåp.'
			})
		);
		expect(result.relevant).toBe(true);
		expect(result.matchedTopics).toContain('matsvinn');
		expect(result.excludedBy).toBeNull();
	});

	it('excludes crime and politics headlines', () => {
		expect(
			scoreNewsRelevance(item({ title: 'Man skjuten efter bråk', description: 'Polisen utreder.' }))
				.relevant
		).toBe(false);
		expect(
			scoreNewsRelevance(item({ title: 'Riksdagen debatterar val', description: 'Politik i fokus.' }))
				.excludedBy
		).toBeTruthy();
	});

	it('excludes health conspiracy angles', () => {
		const result = scoreNewsRelevance(
			item({
				title: 'Konspiration om mat och vaccin',
				description: 'Påståenden sprids online.'
			})
		);
		expect(result.relevant).toBe(false);
		expect(result.excludedBy).toBe('konspiration');
	});
});

describe('pickRelevantSvtNewsItem', () => {
	it('returns first relevant headline in feed order', () => {
		const items = parseRssItems(SAMPLE_RSS);
		const result = pickRelevantSvtNewsItem(items);
		expect(result.relevant).toBe(true);
		expect(result.item?.title).toContain('Matpriser');
		expect(result.matchedTopics.length).toBeGreaterThan(0);
	});

	it('returns not relevant when no headline matches', () => {
		const items = [
			item({ title: 'Man skjuten i centrum', description: 'Brott utreds.' }),
			item({ title: 'Kändis vann pris', description: 'Melodifestivalen.' })
		];
		expect(pickRelevantSvtNewsItem(items).relevant).toBe(false);
	});
});

describe('resolveGuideNewsContext', () => {
	it('returns not_relevant when RSS has no Skaffu topics', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			text: async () =>
				`<?xml version="1.0"?><rss><channel><item><title>Man skjuten</title><link>https://x</link><description>brott</description></item></channel></rss>`
		});
		const result = await resolveGuideNewsContext({ fetchFn });
		expect(result.mode).toBe('not_relevant');
	});

	it('returns relevant when RSS has matching headline', async () => {
		const fetchFn = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => SAMPLE_RSS
		});
		const result = await resolveGuideNewsContext({ fetchFn });
		expect(result.mode).toBe('relevant');
		expect(result.relevance?.item?.title).toContain('Matpriser');
	});

	it('returns rss_unavailable on fetch failure', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('network'));
		const result = await resolveGuideNewsContext({ fetchFn });
		expect(result.mode).toBe('rss_unavailable');
		expect(result.headlines).toEqual([]);
	});
});

describe('formatNewsContextForPrompt', () => {
	it('includes headline and cautious attribution guidance', () => {
		const text = formatNewsContextForPrompt(
			item({ title: 'Matpriser stiger', description: 'livsmedel' }),
			['matpriser', 'livsmedel']
		);
		expect(text).toContain('Matpriser stiger');
		expect(text).toContain('enligt rapportering');
	});
});
