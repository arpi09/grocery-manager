<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import { trackProductEvent } from '$lib/client/product-events';
	import { getSignupAt } from '$lib/utils/onboarding';
	import {
		dismissInkopHouseholdInvitePrompt,
		recordInkopHouseholdInviteShown,
		shouldShowInkopHouseholdInvitePrompt
	} from '$lib/utils/household-invite-prompt';

	interface Props {
		memberCount?: number;
		uncheckedCount: number;
		checkedCount: number;
		listHasItems: boolean;
	}

	let { memberCount = 0, uncheckedCount, checkedCount, listHasItems }: Props = $props();

	let visible = $state(false);
	let sharing = $state(false);
	let copied = $state(false);
	let shownEventSent = $state(false);

	const userId = $derived(page.data.user?.id ?? null);

	function evaluateVisibility() {
		if (!browser || !userId) {
			visible = false;
			return;
		}

		visible =
			shouldShowInkopHouseholdInvitePrompt({
				userId,
				memberCount,
				listHasItems,
				uncheckedCount,
				checkedCount,
				signupAt: getSignupAt(userId)
			});
	}

	async function copyInviteLink(link: string) {
		if (!browser) return;
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	async function shareInviteLink(link: string) {
		if (!browser || !navigator.share) {
			await copyInviteLink(link);
			return;
		}

		try {
			await navigator.share({
				title: t('household.shareInvite'),
				text: t('household.shareInviteNote'),
				url: link
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			await copyInviteLink(link);
		}
	}

	async function inviteSomeone() {
		if (!browser || !userId || sharing) {
			return;
		}

		void trackProductEvent('household_invite_prompt_clicked', { context: 'inkop' });
		sharing = true;

		try {
			const response = await fetch('/api/household/share-invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'inkop' })
			});
			const body = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				inviteUrl?: string;
			};

			if (response.ok && body.ok && body.inviteUrl) {
				await shareInviteLink(body.inviteUrl);
			}
		} finally {
			sharing = false;
		}
	}

	function dismiss() {
		dismissInkopHouseholdInvitePrompt(userId);
		void trackProductEvent('household_invite_prompt_dismissed', { context: 'inkop' });
		visible = false;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void userId;
		void memberCount;
		void uncheckedCount;
		void checkedCount;
		void listHasItems;
		evaluateVisibility();
	});

	$effect(() => {
		if (!visible || !userId || shownEventSent) {
			return;
		}

		recordInkopHouseholdInviteShown(userId);
		void trackProductEvent('household_invite_prompt_shown', { context: 'inkop' });
		shownEventSent = true;
	});
</script>

{#if visible}
	<aside
		class="inkop-invite-banner"
		role="region"
		aria-label={t('householdInvite.inkopBannerAria')}
		data-testid="inkop-household-invite-banner"
	>
		<p class="banner-body">{t('householdInvite.inkopBannerBody')}</p>
		<div class="banner-actions">
			<Button
				type="button"
				variant="primary"
				disabled={sharing}
				data-analytics-id="household_invite.inkop_cta"
				onclick={inviteSomeone}
			>
				{sharing ? t('common.loading') : copied ? t('common.copied') : t('householdInvite.inkopBannerCta')}
			</Button>
			<Button type="button" variant="ghost" onclick={dismiss}>
				{t('householdInvite.inkopBannerDismiss')}
			</Button>
		</div>
	</aside>
{/if}

<style>
	.inkop-invite-banner {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.banner-body {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.banner-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
