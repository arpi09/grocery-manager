import { describe, expect, it, vi } from 'vitest';
import {
	isHardcodedStaleRapportLink,
	isStaleSeedBody,
	LINKEDIN_SEED_BODY,
	parseRapportMonthFromUrl,
	previousReportMonth,
	resolveDefaultSocialLink,
	resolveSocialPostLinkStatus,
	shouldRepairSeedDraftLink
} from '$lib/marketing/linkedin-draft-defaults';
import type { SkaffurapportSnapshot } from '$lib/domain/skaffurapport';

function reportSnapshot(overrides: Partial<SkaffurapportSnapshot> = {}): SkaffurapportSnapshot {
	return {
		month: '2026-05',
		generatedAt: '2026-06-01T00:00:00.000Z',
		householdCount: 12,
		eventCount: 40,
		meetsKAnonymity: true,
		isBetaCohort: false,
		topWastedCategory: null,
		peakWasteWeekday: null,
		avgWastePerHousehold: null,
		weekdayChart: [],
		categoryChart: [],
		...overrides
	};
}

describe('previousReportMonth', () => {
	it('returns previous calendar month in UTC', () => {
		expect(previousReportMonth(new Date('2026-06-10T12:00:00Z'))).toBe('2026-05');
		expect(previousReportMonth(new Date('2026-01-15T12:00:00Z'))).toBe('2025-12');
	});
});

describe('parseRapportMonthFromUrl', () => {
	it('extracts month from rapport URLs', () => {
		expect(parseRapportMonthFromUrl('https://skaffu.com/rapport/2026-05')).toBe('2026-05');
		expect(parseRapportMonthFromUrl('/rapport/2026-05/')).toBe('2026-05');
	});

	it('returns null for non-rapport URLs', () => {
		expect(parseRapportMonthFromUrl('https://skaffu.com/guider/test')).toBeNull();
		expect(parseRapportMonthFromUrl(null)).toBeNull();
	});
});

describe('resolveDefaultSocialLink', () => {
	it('prefers previous-month rapport when k-anonymity is met', async () => {
		const getPublishedReport = vi.fn().mockResolvedValue(reportSnapshot({ month: '2026-05' }));
		const result = await resolveDefaultSocialLink({
			skaffurapportService: { getPublishedReport },
			now: new Date('2026-06-10T12:00:00Z')
		});
		expect(result).toEqual({
			linkUrl: 'https://skaffu.com/rapport/2026-05',
			utmContent: 'post_a',
			reason: 'report_ready'
		});
	});

	it('falls back to latest guide when rapport is not ready', async () => {
		const getPublishedReport = vi.fn().mockResolvedValue(
			reportSnapshot({ month: '2026-05', meetsKAnonymity: false, householdCount: 3 })
		);
		const getLatestPublishedGuides = vi.fn().mockReturnValue([
			{
				slug: 'minska-matsvinn-hemma-app',
				title: 'Guide',
				description: 'Desc',
				date: '2026-05-01',
				keywords: []
			}
		]);
		const result = await resolveDefaultSocialLink({
			skaffurapportService: { getPublishedReport },
			getLatestPublishedGuides,
			now: new Date('2026-06-10T12:00:00Z')
		});
		expect(result).toEqual({
			linkUrl: 'https://skaffu.com/guider/minska-matsvinn-hemma-app',
			utmContent: 'minska-matsvinn-hemma-app',
			reason: 'latest_guide'
		});
	});

	it('falls back to landing when rapport and guides are unavailable', async () => {
		const getPublishedReport = vi.fn().mockResolvedValue(null);
		const getLatestPublishedGuides = vi.fn().mockReturnValue([]);
		const result = await resolveDefaultSocialLink({
			skaffurapportService: { getPublishedReport },
			getLatestPublishedGuides,
			now: new Date('2026-06-10T12:00:00Z')
		});
		expect(result).toEqual({
			linkUrl: 'https://skaffu.com',
			utmContent: 'photo_tip',
			reason: 'landing'
		});
	});
});

describe('resolveSocialPostLinkStatus', () => {
	it('flags rapport links without k-anonymity and suggests a better link', async () => {
		const getPublishedReport = vi.fn().mockResolvedValue(
			reportSnapshot({ month: '2026-06', meetsKAnonymity: false })
		);
		const getLatestPublishedGuides = vi.fn().mockReturnValue([
			{
				slug: 'minska-matsvinn-hemma-app',
				title: 'Guide',
				description: 'Desc',
				date: '2026-05-01',
				keywords: []
			}
		]);
		const status = await resolveSocialPostLinkStatus('https://skaffu.com/rapport/2026-06', {
			skaffurapportService: { getPublishedReport },
			getLatestPublishedGuides
		});
		expect(status.needsBetterLink).toBe(true);
		expect(status.meetsKAnonymity).toBe(false);
		expect(status.suggestedLink?.reason).toBe('latest_guide');
	});
});

describe('seed repair helpers', () => {
	it('detects stale hardcoded rapport links and old seed body', () => {
		expect(isHardcodedStaleRapportLink('https://skaffu.com/rapport/2026-06')).toBe(true);
		expect(shouldRepairSeedDraftLink('https://skaffu.com/rapport/2026-06', true)).toBe(true);
		expect(shouldRepairSeedDraftLink('https://skaffu.com/rapport/2026-05', false)).toBe(true);
		expect(shouldRepairSeedDraftLink('https://skaffu.com/guider/test', null)).toBe(false);
		expect(isStaleSeedBody('Skaffurapporten för juni')).toBe(true);
		expect(isStaleSeedBody(LINKEDIN_SEED_BODY)).toBe(false);
		expect(LINKEDIN_SEED_BODY).not.toContain('—');
	});
});
