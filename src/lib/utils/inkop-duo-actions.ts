import { t } from '$lib/i18n';

export type HouseholdInviteContext = 'lista' | 'inkop_duo_bar' | 'inkop' | 'onboarding';
export type ShoppingListShareContext = 'lista' | 'inkop_duo_bar' | 'post_onboarding';

export type ShareDeliveryMethod = 'native_share' | 'clipboard' | 'aborted';

export async function copyTextToClipboard(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
}

export async function fetchShoppingListShareUrl(): Promise<{
	ok: boolean;
	url?: string;
	error?: string;
}> {
	const response = await fetch('/api/shopping-list/share', { method: 'POST' });
	const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
	if (!response.ok || !body.ok || !body.url) {
		return { ok: false, error: body.error };
	}
	return { ok: true, url: body.url };
}

/** Clipboard first, then native share — matches ShoppingListPanel share flow. */
export async function shareShoppingListUrl(url: string): Promise<ShareDeliveryMethod> {
	await copyTextToClipboard(url);

	if (navigator.share && navigator.canShare?.({ url })) {
		try {
			await navigator.share({
				title: t('shoppingListShare.shareLinkTitle'),
				text: t('shoppingListShare.shareLinkNote'),
				url
			});
			return 'native_share';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return 'aborted';
			}
		}
	}

	return 'clipboard';
}

export async function fetchHouseholdInviteUrl(
	context: HouseholdInviteContext
): Promise<{ ok: boolean; inviteUrl?: string }> {
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
		return { ok: false };
	}

	return { ok: true, inviteUrl: body.inviteUrl };
}

/** Native share first, clipboard fallback — matches lista invite flow. */
export async function shareHouseholdInviteUrl(url: string): Promise<ShareDeliveryMethod> {
	if (navigator.share) {
		try {
			await navigator.share({
				title: t('household.shareInvite'),
				text: t('household.shareInviteNote'),
				url
			});
			return 'native_share';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return 'aborted';
			}
		}
	}

	await copyTextToClipboard(url);
	return 'clipboard';
}
