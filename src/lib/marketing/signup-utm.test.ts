import { describe, expect, it } from 'vitest';
import {
	parseSignupUtmCookie,
	parseSignupUtmFromSearchParams,
	resolveSignupUtm,
	serializeSignupUtmCookie,
	signupUtmToEventMetadata
} from './signup-utm';

describe('parseSignupUtmFromSearchParams', () => {
	it('keeps signup fields only and ignores utm_term', () => {
		const utm = parseSignupUtmFromSearchParams(
			new URLSearchParams(
				'utm_source=reddit&utm_medium=community&utm_campaign=matsvinn_w12&utm_content=post_a&utm_term=ignored&foo=bar'
			)
		);
		expect(utm).toEqual({
			source: 'reddit',
			medium: 'community',
			campaign: 'matsvinn_w12',
			content: 'post_a'
		});
	});

	it('returns null when no signup utm present', () => {
		expect(parseSignupUtmFromSearchParams(new URLSearchParams('hero=b'))).toBeNull();
	});

	it('truncates overly long values', () => {
		const long = 'x'.repeat(200);
		const utm = parseSignupUtmFromSearchParams(new URLSearchParams(`utm_source=${long}`));
		expect(utm?.source).toHaveLength(128);
	});
});

describe('signup utm cookie', () => {
	it('round-trips through serialize and parse', () => {
		const original = {
			source: 'facebook',
			medium: 'community',
			campaign: 'foraldrar_w13'
		};
		const cookie = serializeSignupUtmCookie(original);
		expect(parseSignupUtmCookie(cookie)).toEqual(original);
	});
});

describe('signupUtmToEventMetadata', () => {
	it('maps signup fields to utm_* metadata keys', () => {
		expect(
			signupUtmToEventMetadata({
				source: 'reddit',
				medium: 'community',
				campaign: 'matsvinn_w12',
				content: 'post_a'
			})
		).toEqual({
			utm_source: 'reddit',
			utm_medium: 'community',
			utm_campaign: 'matsvinn_w12',
			utm_content: 'post_a'
		});
	});

	it('returns empty object when attribution is missing', () => {
		expect(signupUtmToEventMetadata(null)).toEqual({});
	});
});

describe('resolveSignupUtm', () => {
	it('prefers URL values over cookie per field', () => {
		const resolved = resolveSignupUtm({
			searchParams: new URLSearchParams('utm_source=reddit&utm_campaign=new_w12'),
			cookieValue: 'utm_source=facebook&utm_medium=community&utm_content=post_a'
		});
		expect(resolved).toEqual({
			source: 'reddit',
			medium: 'community',
			campaign: 'new_w12',
			content: 'post_a'
		});
	});

	it('uses cookie when URL has no utm', () => {
		expect(
			resolveSignupUtm({
				searchParams: new URLSearchParams(),
				cookieValue: 'utm_source=instagram&utm_medium=community'
			})
		).toEqual({ source: 'instagram', medium: 'community' });
	});
});
