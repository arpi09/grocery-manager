<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import { isFreeListingItem } from '$lib/domain/market-pricing';
	import { listingItemPriceSek } from '$lib/domain/market-pricing-display';
	import { t } from '$lib/i18n';

	interface Props {
		item: {
			pricingMode?: 'free' | 'percent_of_reference' | 'fixed';
			askingPriceSek?: number;
		};
	}

	let { item }: Props = $props();

	const priceSek = $derived(listingItemPriceSek(item));
	const label = $derived(
		priceSek == null ? t('marketV04.priceFree') : t('marketV04.priceAmount', { amount: priceSek })
	);
	const isFree = $derived(isFreeListingItem(item));
</script>

<Badge tone={isFree ? 'default' : 'warning'}>{label}</Badge>
