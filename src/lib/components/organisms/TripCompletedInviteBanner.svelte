<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import {
		dismissValueMomentInvite,
		recordValueMomentInviteShown,
		shouldShowValueMomentInvite
	} from '$lib/utils/household-invite-prompt';

	interface Props {
		memberCount: number;
		trigger?: number;
	}

	let { memberCount, trigger = 0 }: Props = $props();

	let visible = $state(false);
	let sharing = $state(false);
	let shownEventSent = $state(false);
	let lastTrigger = $state(0);

	const userId = $derived(page.data.user?.id ?? null);

	function evaluateVisibility() {
		if (!browser || !userId || trigger <= 0 || trigger === lastTrigger) {
			return;
		}

		lastTrigger = trigger;
		visible = shouldShowValueMomentInvite({
			context: 'trip_completed',
			userId,
			memberCount
		});
	}

	async function shareInviteLink(link: string) {
		if (!browser) return;
		if (navigator.share) {
			try {
				await navigator.share({
					title: t('household.shareInvite'),
					text: t('household.shareInviteNote'),
					url: link
				});
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}
			}
		}
		await navigator.clipboard.writeText(link);
	}

	async function invitePartner() {
		if (!browser || !userId || sharing) {
			return;
		}

		void trackProductEvent('household_invite_prompt_clicked', { context: 'trip_completed' });
		sharing = true;

		try {
			const response = await fetch('/api/household/share-invite', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'trip_completed' })
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
		dismissValueMomentInvite('trip_completed', userId);
		void trackProductEvent('household_invite_prompt_dismissed', { context: 'trip_completed' });
		visible = false;
	}

	$effect(() => {
		void trigger;
		void memberCount;
		void userId;
		evaluateVisibility();
	});

	$effect(() => {
		if (!visible || !userId || shownEventSent) {
			return;
		}

		recordValueMomentInviteShown('trip_completed', userId);
		void trackProductEvent('household_invite_prompt_shown', { context: 'trip_completed' });
		shownEventSent = true;
	});
</script>

{#if visible}
	<aside
		class="trip-invite-banner"
		role="region"
		aria-label={t('householdInvite.tripCompletedBannerAria')}
		data-testid="trip-completed-invite-banner"
	>
		<p class="banner-body">{t('householdInvite.tripCompletedBannerBody')}</p>
		<div class="banner-actions">
			<Button
				type="button"
				variant="primary"
				disabled={sharing}
				data-testid="trip-completed-invite-cta"
				onclick={invitePartner}
			>
				{sharing ? t('common.loading') : t('householdInvite.tripCompletedBannerCta')}
			</Button>
			<Button type="button" variant="ghost" onclick={dismiss}>
				{t('householdInvite.tripCompletedBannerDismiss')}
			</Button>
		</div>
	</aside>
{/if}

<style>
	.trip-invite-banner {
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
