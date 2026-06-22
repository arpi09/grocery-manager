<script lang="ts">
	import { formatPortionQuantityLabel } from '$lib/domain/market-pricing-display';
	import { t } from '$lib/i18n';

	interface Props {
		quantity: string;
		unit: string | null;
		portionPercent?: number;
	}

	let { quantity, unit, portionPercent }: Props = $props();

	const adjusted = $derived(formatPortionQuantityLabel({ quantity, unit, portionPercent }));
	const quantityWithUnit = $derived(
		adjusted.unit ? `${adjusted.quantity} ${adjusted.unit}` : adjusted.quantity
	);
	const label = $derived(t('marketV04.quantityRemaining', { quantityWithUnit }));
</script>

<span class="quantity-label">{label}</span>

<style>
	.quantity-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
