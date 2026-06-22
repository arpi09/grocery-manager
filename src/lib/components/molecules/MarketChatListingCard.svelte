<script lang="ts">
	import type { ExpiringShareItemSnapshot } from '$lib/domain/expiring-share';
	import { daysUntilExpiry, formatDaysLeft } from '$lib/domain/expiry';
	import { sharePrimaryPriceSek, shareIsFreeListing } from '$lib/domain/market-pricing-display';
	import MarketListingPriceBadge from '$lib/components/molecules/MarketListingPriceBadge.svelte';
	import MarketListingQuantityLabel from '$lib/components/molecules/MarketListingQuantityLabel.svelte';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		shareId: string;
		items: ExpiringShareItemSnapshot[];
	}

	let { shareId, items }: Props = $props();

	const locale = getLocale();

	const primaryItem = $derived(items[0] ?? null);
	const title = $derived(
		primaryItem
			? items.length > 1
				? t('marketV05.listingTitleWithMore', {
						name: primaryItem.name,
						count: items.length - 1
					})
				: primaryItem.name
			: t('marketV01.listingTitle')
	);

	const primaryPriceSek = $derived(sharePrimaryPriceSek(items));
	const priceItem = $derived(
		primaryPriceSek != null
			? { pricingMode: 'fixed' as const, askingPriceSek: primaryPriceSek }
			: { pricingMode: 'free' as const, askingPriceSek: undefined }
	);
	const isFree = $derived(shareIsFreeListing(items));

	const expiryLabel = $derived.by(() => {
		const dated = items
			.map((item) => item.expiresOn)
			.filter((value): value is string => value != null);
		if (dated.length === 0) {
			return null;
		}
		const soonest = dated.sort()[0];
		const days = daysUntilExpiry(soonest);
		return formatDaysLeft(days, locale);
	});

	const shareHref = $derived(`/grannskafferiet/marknad/share/${shareId}`);
</script>

<a
	class="listing-card"
	href={shareHref}
	data-testid="market-chat-listing-card"
	aria-label={t('marketV05.viewListing')}
>
	<div class="listing-main">
		<p class="listing-title">{title}</p>
		<div class="listing-meta">
			{#if primaryItem}
				<MarketListingQuantityLabel
					quantity={primaryItem.quantity}
					unit={primaryItem.unit}
					portionPercent={primaryItem.portionPercent}
				/>
			{/if}
			{#if expiryLabel}
				<span class="expiry">{expiryLabel}</span>
			{/if}
		</div>
	</div>
	<div class="listing-side">
		{#if isFree}
			<MarketListingPriceBadge item={{ pricingMode: 'free' }} />
		{:else}
			<MarketListingPriceBadge item={priceItem} />
		{/if}
		<span class="view-link">{t('marketV05.viewListing')}</span>
	</div>
</a>

<style>
	.listing-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		text-decoration: none;
		color: inherit;
	}

	.listing-card:hover,
	.listing-card:focus-visible {
		background: var(--color-surface-muted);
	}

	.listing-main {
		min-width: 0;
		display: grid;
		gap: var(--space-2xs);
	}

	.listing-title {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.listing-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		font-size: 0.8125rem;
	}

	.expiry {
		color: var(--color-text-muted);
	}

	.listing-side {
		flex-shrink: 0;
		display: grid;
		justify-items: end;
		gap: var(--space-2xs);
	}

	.view-link {
		font-size: 0.75rem;
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
