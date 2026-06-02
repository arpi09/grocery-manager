<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import { PRICE_HYPOTHESIS_SEK } from '$lib/domain/plan';

	interface Props {
		isOwner: boolean;
		checkoutStatus?: 'success' | 'cancel' | null;
	}

	let { isOwner, checkoutStatus = null }: Props = $props();

	let loadingInterval = $state<'month' | 'year' | null>(null);
	let errorMessage = $state<string | null>(null);

	async function startCheckout(interval: 'month' | 'year') {
		if (!isOwner || loadingInterval) {
			return;
		}

		loadingInterval = interval;
		errorMessage = null;

		try {
			const response = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ interval })
			});
			const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };

			if (!response.ok || !payload.ok || !payload.url) {
				errorMessage = payload.error ?? t('settings.plan.upgradeError');
				return;
			}

			window.location.href = payload.url;
		} catch {
			errorMessage = t('settings.plan.upgradeError');
		} finally {
			loadingInterval = null;
		}
	}
</script>

<div class="pro-upgrade">
	{#if checkoutStatus === 'success'}
		<FeedbackBanner tone="success" message={t('settings.plan.checkoutSuccess')} />
	{:else if checkoutStatus === 'cancel'}
		<FeedbackBanner tone="info" message={t('settings.plan.checkoutCancel')} />
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	<p class="pro-upgrade-copy">{t('settings.plan.upgradeDescription')}</p>

	<div class="pro-upgrade-actions">
		<Button
			type="button"
			disabled={!isOwner || loadingInterval !== null}
			onclick={() => startCheckout('month')}
		>
			{loadingInterval === 'month'
				? t('settings.plan.upgradeLoading')
				: t('settings.plan.upgradeMonthly', { price: PRICE_HYPOTHESIS_SEK.monthly })}
		</Button>
		<Button
			type="button"
			variant="secondary"
			disabled={!isOwner || loadingInterval !== null}
			onclick={() => startCheckout('year')}
		>
			{loadingInterval === 'year'
				? t('settings.plan.upgradeLoading')
				: t('settings.plan.upgradeYearly', { price: PRICE_HYPOTHESIS_SEK.yearly })}
		</Button>
	</div>

	{#if !isOwner}
		<p class="pro-upgrade-note">{t('settings.plan.upgradeOwnerOnly')}</p>
	{:else}
		<p class="pro-upgrade-note">{t('settings.plan.upgradeTestNote')}</p>
	{/if}
</div>

<style>
	.pro-upgrade {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.pro-upgrade-copy {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.pro-upgrade-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.pro-upgrade-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
