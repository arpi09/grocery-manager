<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import NearbyShareReportButton from '$lib/components/molecules/NearbyShareReportButton.svelte';
	import { trackProductEvent, trackPublicAcquisitionEvent } from '$lib/client/product-events';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';

	let { data } = $props();

	const locale = getLocale();
	const signupUrl = $derived(buildAcquisitionRegisterUrl('expiring_share', $page.url.origin));
	const expiresAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			data.preview.expiresAt
		)
	);

	onMount(() => {
		void trackPublicAcquisitionEvent('expiring_share_viewed', {
			itemCount: data.preview.items.length,
			acquisition_source: 'expiring_share'
		});
	});

	function handleSignupClick() {
		void trackPublicAcquisitionEvent('expiring_share_cta_clicked', {
			acquisition_source: 'expiring_share'
		});
		void trackProductEvent('register_click', {
			acquisition_source: 'expiring_share'
		});
	}
</script>

<svelte:head>
	<title>{t('expiringShare.publicTitle')}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="share-page">
	<div class="share-shell">
		<header class="share-header">
			<p class="eyebrow">{t('expiringShare.publicEyebrow')}</p>
			<h1>{t('expiringShare.publicTitle')}</h1>
			<p>{t('expiringShare.publicLead')}</p>
			<p class="expires">{t('expiringShare.publicExpires', { date: expiresAtLabel })}</p>
		</header>

		<ul class="item-list">
			{#each data.preview.items as item, index (index)}
				<li>
					<Card class="item-card">
						<div class="item-main">
							<span class="item-name">{item.name}</span>
							<span class="item-location">{locationLabel(locale, item.location)}</span>
						</div>
						<div class="item-meta">
							{#if item.expiresOn}
								{@const daysLeft = daysUntilExpiry(item.expiresOn)}
								<Badge tone="warning">{formatDaysLeft(daysLeft, locale)}</Badge>
							{/if}
							<span class="quantity">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>
						</div>
					</Card>
				</li>
			{/each}
		</ul>

		<p class="gdpr-note" role="note">{t('expiringShare.publicGdprNote')}</p>

		{#if $page.data.user}
			<div class="report-row">
				<p>{t('nearbySharing.trustNote')}</p>
				<NearbyShareReportButton token={data.token} variant="secondary" />
			</div>
		{/if}

		<div class="signup-cta">
			<h2>{t('expiringShare.publicSignupTitle')}</h2>
			<p>{t('expiringShare.publicSignupLead')}</p>
			<a class="signup-cta-btn" href={signupUrl} onclick={handleSignupClick}>
				{t('expiringShare.publicSignupBtn')}
			</a>
		</div>
	</div>
</main>

<style>
	.share-page {
		min-height: 100dvh;
		padding: calc(var(--space-xl) + env(safe-area-inset-top, 0)) var(--page-padding-x)
			calc(var(--space-xl) + env(safe-area-inset-bottom, 0));
		overflow-x: clip;
		background:
			radial-gradient(
				ellipse 80% 50% at 50% -10%,
				color-mix(in srgb, var(--color-primary) 8%, transparent),
				transparent
			),
			var(--color-bg);
	}

	.share-shell {
		max-width: 36rem;
		margin: 0 auto;
		display: grid;
		gap: var(--space-lg);
	}

	.share-header {
		display: grid;
		gap: var(--space-sm);
	}

	.eyebrow {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	h1 {
		margin: 0;
	}

	.expires {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.signup-cta {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.signup-cta h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.signup-cta p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.signup-cta-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 600;
		text-decoration: none;
		text-align: center;
	}

	.signup-cta-btn:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}

	.report-row {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.report-row p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.gdpr-note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
	}

	.item-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.item-card) {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		align-items: center;
	}

	.item-main {
		display: grid;
		gap: var(--space-2xs);
	}

	.item-name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.item-location,
	.quantity {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.item-meta {
		display: grid;
		justify-items: end;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		:global(.item-card) {
			flex-direction: column;
			align-items: flex-start;
		}

		.item-meta {
			width: 100%;
			grid-template-columns: 1fr auto;
			align-items: center;
			justify-items: stretch;
		}

		.quantity {
			justify-self: end;
		}
	}
</style>
