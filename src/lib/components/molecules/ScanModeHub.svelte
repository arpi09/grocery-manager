<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		returnTo: string;
		defaultLocation?: StorageLocation | string;
	}

	let { returnTo, defaultLocation }: Props = $props();

	const locationOption = $derived(
		defaultLocation && typeof defaultLocation === 'string'
			? { location: defaultLocation }
			: defaultLocation
				? { location: defaultLocation as StorageLocation }
				: undefined
	);
	const barcodeHref = $derived(scanModeHref('barcode', returnTo, locationOption));
	const receiptHref = $derived(scanModeHref('receipt', returnTo));
	const photoHref = $derived(scanModeHref('photo', returnTo, locationOption));
</script>

<div class="hub">
	<Card href={barcodeHref} interactive class="tile tile-primary">
		<span class="icon-wrap icon-wrap-primary" aria-hidden="true">
			<FeatureIcon id="barcode" size={24} />
		</span>
		<h2>{t('scan.modes.barcode')}</h2>
		<p>{t('scan.modeTiles.barcode.description')}</p>
	</Card>

	<Card href={receiptHref} interactive class="tile">
		<span class="icon-wrap" aria-hidden="true">
			<FeatureIcon id="receipt" size={24} />
		</span>
		<h2>{t('scan.modes.receipt')}</h2>
		<p>{t('scan.modeTiles.receipt.description')}</p>
	</Card>

	<Card href={photoHref} interactive class="tile">
		<span class="icon-wrap" aria-hidden="true">
			<FeatureIcon id="photo" size={24} />
		</span>
		<h2>{t('photoRound.title')}</h2>
		<p>{t('scan.modeTiles.photoRound.description')}</p>
	</Card>
</div>

<style>
	.hub {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 560px) {
		.hub {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	:global(.tile) {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-height: 100%;
	}

	:global(.tile-primary) {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.icon-wrap-primary {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	p {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
