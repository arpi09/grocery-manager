import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

import {
	createAndShareHouseholdInvite,
	createHouseholdShareInvite,
	shareLinkWithFallback
} from './household-share-invite';

const LINK = 'https://skaffu.com/invite/token-123';
const TITLE = 'Dela hushållet';
const TEXT = 'Gå med i vårt hushåll';

function stubNavigator(overrides: Record<string, unknown>) {
	vi.stubGlobal('navigator', overrides);
}

function inviteResponse(body: unknown, ok = true) {
	return {
		ok,
		json: () => Promise.resolve(body)
	} as Response;
}

describe('shareLinkWithFallback', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('uses Web Share API when available', async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		const writeText = vi.fn();
		stubNavigator({
			share,
			canShare: () => true,
			clipboard: { writeText }
		});

		await expect(shareLinkWithFallback(LINK, TITLE, TEXT)).resolves.toBe('shared');
		expect(share).toHaveBeenCalledWith({ title: TITLE, text: TEXT, url: LINK });
		expect(writeText).not.toHaveBeenCalled();
	});

	it('returns aborted when the user closes the share sheet, without copying', async () => {
		const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
		const writeText = vi.fn();
		stubNavigator({
			share,
			canShare: () => true,
			clipboard: { writeText }
		});

		await expect(shareLinkWithFallback(LINK, TITLE, TEXT)).resolves.toBe('aborted');
		expect(writeText).not.toHaveBeenCalled();
	});

	it('falls back to clipboard when Web Share is unavailable', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubNavigator({ clipboard: { writeText } });

		await expect(shareLinkWithFallback(LINK, TITLE, TEXT)).resolves.toBe('copied');
		expect(writeText).toHaveBeenCalledWith(LINK);
	});

	it('falls back to clipboard when Web Share fails with a non-abort error', async () => {
		const share = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
		const writeText = vi.fn().mockResolvedValue(undefined);
		stubNavigator({
			share,
			canShare: () => true,
			clipboard: { writeText }
		});

		await expect(shareLinkWithFallback(LINK, TITLE, TEXT)).resolves.toBe('copied');
		expect(writeText).toHaveBeenCalledWith(LINK);
	});
});

describe('createHouseholdShareInvite', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns the invite url on success and sends the context', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(inviteResponse({ ok: true, inviteUrl: LINK }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(createHouseholdShareInvite('onboarding_v8')).resolves.toBe(LINK);
		expect(fetchMock).toHaveBeenCalledWith('/api/household/share-invite', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ context: 'onboarding_v8' })
		});
	});

	it('returns null on http failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(inviteResponse({}, false)));
		await expect(createHouseholdShareInvite('onboarding_v8')).resolves.toBeNull();
	});

	it('returns null when the body lacks an invite url', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(inviteResponse({ ok: true })));
		await expect(createHouseholdShareInvite('onboarding_v8')).resolves.toBeNull();
	});
});

describe('createAndShareHouseholdInvite', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns error when invite creation fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(inviteResponse({}, false)));
		const share = vi.fn();
		stubNavigator({ share, canShare: () => true, clipboard: { writeText: vi.fn() } });

		await expect(
			createAndShareHouseholdInvite({ context: 'onboarding_v8', title: TITLE, text: TEXT })
		).resolves.toEqual({ status: 'error' });
		expect(share).not.toHaveBeenCalled();
	});

	it('shares the created invite url', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(inviteResponse({ ok: true, inviteUrl: LINK }))
		);
		const share = vi.fn().mockResolvedValue(undefined);
		stubNavigator({ share, canShare: () => true, clipboard: { writeText: vi.fn() } });

		await expect(
			createAndShareHouseholdInvite({ context: 'onboarding_v8', title: TITLE, text: TEXT })
		).resolves.toEqual({ status: 'shared', inviteUrl: LINK });
		expect(share).toHaveBeenCalledWith({ title: TITLE, text: TEXT, url: LINK });
	});
});
