import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPublicEnv } = vi.hoisted(() => ({
	mockPublicEnv: {
		PUBLIC_APP_URL: undefined as string | undefined,
		PUBLIC_ORIGIN: undefined as string | undefined
	}
}));

vi.mock('$env/dynamic/public', () => ({
	env: mockPublicEnv
}));

import {
	ACQUISITION_SOURCES,
	buildAcquisitionLandingUrl,
	buildAcquisitionRegisterUrl,
	isShoppingShareSignupUtm,
	resolveSharedListSignupSource,
	shouldRecordSharedListSignupCompleted,
	tokenTelemetryPrefix,
	type AcquisitionSource
} from './acquisition-attribution';

const EXPECTED_QUERY =
	'utm_source=skaffu&utm_medium=product&utm_campaign=acquisition_wedge&utm_content=';

describe('ACQUISITION_SOURCES', () => {
	it('includes all wedge source labels', () => {
		expect(ACQUISITION_SOURCES).toEqual([
			'shopping_share',
			'city_feed',
			'expiring_share',
			'household_invite_inkop',
			'export'
		]);
	});
});

describe('buildAcquisitionRegisterUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = undefined;
	});

	it.each(ACQUISITION_SOURCES)('builds register URL with UTM for %s', (source: AcquisitionSource) => {
		expect(buildAcquisitionRegisterUrl(source, 'https://homepantry.com')).toBe(
			`/register?${EXPECTED_QUERY}${source}`
		);
	});

	it('returns absolute URL when app origin differs from request', () => {
		mockPublicEnv.PUBLIC_APP_URL = 'https://app.example';
		expect(buildAcquisitionRegisterUrl('shopping_share', 'https://homepantry.com')).toBe(
			`https://app.example/register?${EXPECTED_QUERY}shopping_share`
		);
	});
});

describe('buildAcquisitionLandingUrl', () => {
	beforeEach(() => {
		mockPublicEnv.PUBLIC_APP_URL = undefined;
		mockPublicEnv.PUBLIC_ORIGIN = 'https://homepantry.com';
	});

	it.each(ACQUISITION_SOURCES)('builds landing URL with UTM for %s', (source: AcquisitionSource) => {
		expect(buildAcquisitionLandingUrl(source, 'https://homepantry.com')).toBe(
			`/?${EXPECTED_QUERY}${source}`
		);
	});

	it('returns absolute URL when app origin differs from request', () => {
		mockPublicEnv.PUBLIC_APP_URL = 'https://app.example';
		expect(buildAcquisitionLandingUrl('city_feed', 'https://homepantry.com')).toBe(
			`https://app.example/?${EXPECTED_QUERY}city_feed`
		);
	});
});

describe('tokenTelemetryPrefix', () => {
	it('returns stable prefix for same token', () => {
		expect(tokenTelemetryPrefix('abc123')).toBe(tokenTelemetryPrefix('abc123'));
		expect(tokenTelemetryPrefix('abc123').length).toBeLessThanOrEqual(8);
	});

	it('differs for different tokens', () => {
		expect(tokenTelemetryPrefix('token-a')).not.toBe(tokenTelemetryPrefix('token-b'));
	});
});

describe('shared list signup attribution', () => {
	it('detects shopping_share UTM', () => {
		expect(
			isShoppingShareSignupUtm({
				source: 'skaffu',
				medium: 'product',
				campaign: 'acquisition_wedge',
				content: 'shopping_share'
			})
		).toBe(true);
	});

	it('prefers lista_join when cookie intent is pending', () => {
		expect(
			resolveSharedListSignupSource({
				listaJoinPending: true,
				signupUtm: {
					source: 'skaffu',
					medium: 'product',
					campaign: 'acquisition_wedge',
					content: 'shopping_share'
				}
			})
		).toBe('lista_join');
	});

	it('records shared list signup for shopping_share or lista_join', () => {
		expect(
			shouldRecordSharedListSignupCompleted({
				signupUtm: {
					source: 'skaffu',
					medium: 'product',
					campaign: 'acquisition_wedge',
					content: 'shopping_share'
				}
			})
		).toBe(true);
		expect(shouldRecordSharedListSignupCompleted({ listaJoinPending: true })).toBe(true);
		expect(shouldRecordSharedListSignupCompleted({})).toBe(false);
	});
});
