import { browser } from '$app/environment';

export type ShareLinkOutcome = 'shared' | 'copied' | 'aborted' | 'unavailable';

export type HouseholdInviteShareOutcome =
	| { status: ShareLinkOutcome; inviteUrl: string }
	| { status: 'error' };

/**
 * Delar en länk via Web Share API med clipboard-fallback.
 * 'aborted' = användaren stängde share-sheeten (inget skrevs till clipboard).
 * Kastar om clipboard-skrivning nekas — anroparen avgör feedback.
 */
export async function shareLinkWithFallback(
	link: string,
	title: string,
	text: string
): Promise<ShareLinkOutcome> {
	if (!browser) {
		return 'unavailable';
	}

	if (navigator.share && navigator.canShare?.({ url: link })) {
		try {
			await navigator.share({ title, text, url: link });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return 'aborted';
			}
		}
	}

	await navigator.clipboard.writeText(link);
	return 'copied';
}

export async function createHouseholdShareInvite(context: string): Promise<string | null> {
	const response = await fetch('/api/household/share-invite', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ context })
	});
	const body = (await response.json().catch(() => ({}))) as {
		ok?: boolean;
		inviteUrl?: string;
	};

	if (!response.ok || !body.ok || !body.inviteUrl) {
		return null;
	}

	return body.inviteUrl;
}

export async function createAndShareHouseholdInvite(options: {
	context: string;
	title: string;
	text: string;
}): Promise<HouseholdInviteShareOutcome> {
	const inviteUrl = await createHouseholdShareInvite(options.context);
	if (!inviteUrl) {
		return { status: 'error' };
	}

	const status = await shareLinkWithFallback(inviteUrl, options.title, options.text);
	return { status, inviteUrl };
}
