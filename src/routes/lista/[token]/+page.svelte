<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		trackProductEvent,
		trackPublicAcquisitionEvent
	} from '$lib/client/product-events';
	import { getLocale, t } from '$lib/i18n';
	import { buildAcquisitionRegisterUrl } from '$lib/marketing/acquisition-attribution';

	let { data } = $props();

	const locale = getLocale();
	const signupUrl = $derived(buildAcquisitionRegisterUrl('shopping_share', $page.url.origin));
	const pageTitle = $derived(t(data.preview.title as Parameters<typeof t>[0]));
	const expiresAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			data.preview.expiresAt
		)
	);
	const snapshotAtLabel = $derived(
		new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(data.preview.snapshotAt)
		)
	);

	onMount(() => {
		void trackPublicAcquisitionEvent('shopping_list_share_viewed', {
			itemCount: data.preview.items.length,
			acquisition_source: 'shopping_share'
		});
	});

	function handleSignupClick() {
		void trackPublicAcquisitionEvent('shopping_list_share_cta_clicked', {
			acquisition_source: 'shopping_share'
		});
		void trackProductEvent('register_click', {
			acquisition_source: 'shopping_share'
		});
	}

	function formatQuantity(item: (typeof data.preview.items)[number]): string {
		if (!item.quantity && !item.unit) {
			return '';
		}
		return `${item.quantity ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim();
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="share-page">
	<div class="share-shell">
		<header class="share-header">
			<p class="eyebrow">{t('shoppingListShare.publicEyebrow')}</p>
			<h1>{pageTitle}</h1>
			<p>{t('shoppingListShare.publicLead')}</p>
			<p class="expires">{t('shoppingListShare.publicExpires', { date: expiresAtLabel })}</p>
			<p class="snapshot-at">{t('shoppingListShare.publicSnapshotAt', { date: snapshotAtLabel })}</p>
		</header>

		{#if data.preview.items.length === 0}
			<p class="empty-note">{t('shoppingListShare.emptyList')}</p>
		{:else}
			<ul class="item-list">
				{#each data.preview.items as item, index (index)}
					<li class:checked={item.checked}>
						<Card class="item-card">
							<div class="item-main">
								<span class="item-name">{item.name}</span>
								{#if item.checked}
									<span class="checked-badge">{t('shoppingListShare.checkedBadge')}</span>
								{/if}
							</div>
							{#if formatQuantity(item)}
								<span class="quantity">{formatQuantity(item)}</span>
							{/if}
						</Card>
					</li>
				{/each}
			</ul>
		{/if}

		<p class="gdpr-note" role="note">{t('shoppingListShare.publicGdprNote')}</p>

		<div class="signup-cta">
			<h2>{t('shoppingListShare.publicSignupTitle')}</h2>
			<p>{t('shoppingListShare.publicSignupLead')}</p>
			<a class="signup-cta-btn" href={signupUrl} onclick={handleSignupClick}>
				{t('shoppingListShare.publicSignupBtn')}
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

	.expires,
	.snapshot-at {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.empty-note {
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
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
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		color: var(--color-text);
		font-weight: 600;
		text-decoration: none;
		text-align: center;
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

	.item-list li.checked :global(.item-card) {
		opacity: 0.65;
	}

	.item-list li.checked .item-name {
		text-decoration: line-through;
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

	.checked-badge {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.quantity {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		:global(.item-card) {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
