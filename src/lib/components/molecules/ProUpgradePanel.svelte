<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import { PRICE_HYPOTHESIS_SEK } from '$lib/domain/plan';
	import { startStripeCheckout } from '$lib/utils/stripe-checkout';

	interface Props {
		isOwner: boolean;
		checkoutStatus?: 'success' | 'cancel' | 'portal' | null;
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

		const result = await startStripeCheckout(interval);
		if (!result.ok) {
			errorMessage =
				result.error === 'checkout_failed'
					? t('settings.plan.upgradeError')
					: (result.error ?? t('settings.plan.upgradeError'));
			loadingInterval = null;
			return;
		}

		window.location.href = result.url;
	}
</script>

<div class="pro-upgrade" id="plan-upgrade">
	{#if checkoutStatus === 'cancel'}
		<FeedbackBanner tone="info" message={t('settings.plan.checkoutCancel')} />
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	<p class="pro-upgrade-copy">{t('settings.plan.upgradeDescription')}</p>

	<Button
		type="button"
		class="pro-upgrade-primary"
		disabled={!isOwner || loadingInterval !== null}
		onclick={() => startCheckout('month')}
	>
		{loadingInterval === 'month'
			? t('settings.plan.upgradeLoading')
			: t('settings.plan.upgradePrimary', { price: PRICE_HYPOTHESIS_SEK.monthly })}
	</Button>

	<div class="pro-upgrade-secondary">
		<button
			type="button"
			class="pro-upgrade-yearly"
			disabled={!isOwner || loadingInterval !== null}
			onclick={() => startCheckout('year')}
		>
			{loadingInterval === 'year'
				? t('settings.plan.upgradeLoading')
				: t('settings.plan.upgradeYearlyLink', { price: PRICE_HYPOTHESIS_SEK.yearly })}
		</button>
		<a class="pro-upgrade-plans" href="/priser">{t('settings.plan.seeAllPlans')}</a>
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

	:global(.pro-upgrade-primary) {
		width: 100%;
		justify-content: center;
	}

	.pro-upgrade-secondary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
	}

	.pro-upgrade-yearly {
		padding: 0;
		border: none;
		background: none;
		color: var(--color-primary);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: underline;
		cursor: pointer;
	}

	.pro-upgrade-yearly:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.pro-upgrade-plans {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.pro-upgrade-plans:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.pro-upgrade-note {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
