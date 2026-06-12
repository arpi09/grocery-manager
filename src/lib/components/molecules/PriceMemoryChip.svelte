<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import { fetchLastPaidPrice } from '$lib/client/price-memory';
	import { trackProductEvent } from '$lib/client/product-events';
	import { buildPriceMemoryContext } from '$lib/domain/price-memory-format';
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';

	interface Props {
		normalizedKey: string;
		surface?: string;
	}

	let { normalizedKey, surface }: Props = $props();
	let label = $state<string | null>(null);

	onMount(() => {
		void (async () => {
			const price = await fetchLastPaidPrice(normalizedKey);
			if (!price) return;
			const context = buildPriceMemoryContext(price);
			label = context.storeLabel
				? t('priceMemory.lastPaidWithStore', {
						price: context.formattedUnitPrice,
						date: context.monthYear,
						store: context.storeLabel
					})
				: t('priceMemory.lastPaid', {
						price: context.formattedUnitPrice,
						date: context.monthYear
					});
			void trackProductEvent('price_memory_viewed', { normalizedKey, ...(surface ? { surface } : {}) });
		})();
	});
</script>

{#if label}
	<Badge tone="default">{label}</Badge>
{/if}
