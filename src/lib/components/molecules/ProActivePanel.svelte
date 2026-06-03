<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import { PRO_LIMITS } from '$lib/domain/plan';
	import type { HouseholdBillingState } from '$lib/domain/billing';

	interface Props {
		isOwner: boolean;
		billing: HouseholdBillingState | null;
		stripeCheckoutEnabled: boolean;
		checkoutStatus?: 'success' | 'cancel' | 'portal' | null;
	}

	let { isOwner, billing, stripeCheckoutEnabled, checkoutStatus = null }: Props = $props();

	let portalLoading = $state(false);
	let portalError = $state<string | null>(null);

	const hasStripeCustomer = $derived(Boolean(billing?.stripeCustomerId));
	const isCompPro = $derived(
		billing?.planTier === 'pro' && !billing?.stripeSubscriptionId
	);
	const subscriptionLabel = $derived.by(() => {
		const status = billing?.stripeSubscriptionStatus;
		if (!status) {
			return isCompPro ? t('settings.plan.subscriptionComp') : null;
		}
		if (status === 'active') return t('settings.plan.subscriptionStatus.active');
		if (status === 'trialing') return t('settings.plan.subscriptionStatus.trialing');
		if (status === 'past_due') return t('settings.plan.subscriptionStatus.pastDue');
		if (status === 'canceled') return t('settings.plan.subscriptionStatus.canceled');
		return status;
	});

	async function openPortal() {
		if (!isOwner || portalLoading || !hasStripeCustomer) {
			return;
		}

		portalLoading = true;
		portalError = null;

		try {
			const response = await fetch('/api/stripe/portal', { method: 'POST' });
			const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };

			if (!response.ok || !payload.ok || !payload.url) {
				portalError = payload.error ?? t('settings.plan.portalError');
				return;
			}

			window.location.href = payload.url;
		} catch {
			portalError = t('settings.plan.portalError');
		} finally {
			portalLoading = false;
		}
	}
</script>

<div class="pro-active">
	{#if checkoutStatus === 'portal'}
		<FeedbackBanner tone="info" message={t('settings.plan.portalReturn')} />
	{/if}

	{#if portalError}
		<FeedbackBanner tone="error" message={portalError} />
	{/if}

	<div class="pro-active-hero">
		<span class="pro-active-badge">{t('settings.plan.proBadge')}</span>
		<h3 class="pro-active-title">{t('settings.plan.proActiveTitle')}</h3>
		<p class="pro-active-lead">{t('settings.plan.proActiveLead')}</p>
		{#if subscriptionLabel}
			<p class="pro-active-status">{subscriptionLabel}</p>
		{/if}
	</div>

	<ul class="pro-benefits" aria-label={t('settings.plan.proBenefitsAria')}>
		<li>{t('settings.plan.proUnlimitedAi')}</li>
		<li>{t('settings.plan.proUnlimitedReceipt')}</li>
		<li>{t('settings.plan.proUnlimitedSmartFill')}</li>
		<li>{t('settings.plan.proInsights')}</li>
		<li>{t('settings.plan.proMembers', { max: PRO_LIMITS.maxHouseholdMembers ?? 6 })}</li>
	</ul>

	{#if isOwner}
		<div class="pro-manage">
			<h4 class="pro-manage-heading">{t('settings.plan.manageTitle')}</h4>
			{#if isCompPro}
				<p class="pro-manage-note">{t('settings.plan.manageCompNote')}</p>
			{:else if hasStripeCustomer && stripeCheckoutEnabled}
				<p class="pro-manage-note">{t('settings.plan.managePortalNote')}</p>
				<Button
					type="button"
					onclick={openPortal}
					loading={portalLoading}
					loadingLabel={t('settings.plan.portalLoading')}
				>
					{t('settings.plan.manageSubscription')}
				</Button>
			{:else}
				<p class="pro-manage-note">{t('settings.plan.manageUnavailable')}</p>
			{/if}
			<nav class="pro-manage-links" aria-label={t('settings.plan.manageLinksAria')}>
				<a href="/priser">{t('settings.plan.viewPricing')}</a>
				<a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener noreferrer">
					{t('settings.plan.stripeTerms')}
				</a>
			</nav>
		</div>
	{:else}
		<p class="pro-member-note">{t('settings.plan.memberProNote')}</p>
	{/if}
</div>

<style>
	.pro-active {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--color-border);
		background: linear-gradient(
			165deg,
			color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)),
			var(--color-surface)
		);
	}

	.pro-active-hero {
		position: relative;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface-muted));
	}

	.pro-active-badge {
		display: inline-flex;
		margin-bottom: var(--space-sm);
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-on-primary, #fff);
		background: linear-gradient(
			120deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 65%, #6d28d9)
		);
	}

	.pro-active-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.pro-active-lead {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.pro-active-status {
		margin: var(--space-sm) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.pro-benefits {
		margin: 0;
		padding-left: 1.15rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text);
	}

	.pro-benefits li + li {
		margin-top: 0.3rem;
	}

	.pro-manage {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-sm);
	}

	.pro-manage-heading {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.pro-manage-note {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.pro-manage-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		font-size: 0.85rem;
	}

	.pro-manage-links a {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.pro-member-note {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}
</style>
