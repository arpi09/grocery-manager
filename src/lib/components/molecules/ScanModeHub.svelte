<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';
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
	const manualHref = $derived(
		`/item/new?from=${encodeURIComponent(scanHubHref(returnTo))}${defaultLocation ? `&location=${defaultLocation}` : ''}`
	);
</script>

<div class="hub" data-testid="scan-mode-hub">
	<Card href={photoHref} interactive class="tile tile-primary" data-testid="scan-hub-photo-round">
		<span class="icon-wrap icon-wrap-primary" aria-hidden="true">
			<FeatureIcon id="photo" size={28} />
		</span>
		<h2>{t('photoRound.title')}</h2>
		<p>{t('scan.modeTiles.photoRound.description')}</p>
	</Card>

	<div class="mode-grid" data-testid="scan-hub-mode-grid">
		<Card href={barcodeHref} interactive class="tile" data-testid="scan-hub-barcode">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="barcode" size={24} />
			</span>
			<h2>{t('scan.modes.barcode')}</h2>
			<p>{t('scan.modeTiles.barcode.description')}</p>
		</Card>

		<Card href={receiptHref} interactive class="tile" data-testid="scan-hub-receipt">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="receipt" size={24} />
			</span>
			<h2>{t('scan.modes.receipt')}</h2>
			<p>{t('scan.modeTiles.receipt.description')}</p>
		</Card>

		<Card href={manualHref} interactive class="tile" data-testid="scan-hub-manual">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="box" size={24} />
			</span>
			<h2>{t('scan.modes.manual')}</h2>
			<p>{t('scan.modeTiles.manual.description')}</p>
		</Card>
	</div>
</div>

<style>
	.hub {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.mode-grid {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 560px) {
		.mode-grid {
			grid-template-columns: repeat(2, 1fr);
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
		width: 3.25rem;
		height: 3.25rem;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	:global(.tile-primary) h2 {
		font-size: 1.15rem;
	}

	p {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
