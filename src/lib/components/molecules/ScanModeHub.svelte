<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref, scanSubFlowFrom } from '$lib/utils/scan-nav';

	interface Props {
		returnTo: string;
		defaultLocation?: string;
	}

	let { returnTo, defaultLocation }: Props = $props();

	const hubHref = $derived(scanHubHref(returnTo));
	const subFlowFrom = $derived(scanSubFlowFrom(returnTo));
	const locationQuery = $derived(defaultLocation ? `&location=${defaultLocation}` : '');
	const barcodeHref = $derived(`${hubHref}&mode=barcode${locationQuery}`);
</script>

<div class="hub">
	<Card href={barcodeHref} interactive class="tile tile-primary">
		<span class="icon-wrap icon-wrap-primary" aria-hidden="true">
			<FeatureIcon id="barcode" size={24} />
		</span>
		<h2>{t('scan.modes.barcode')}</h2>
		<p>{t('scan.modeTiles.barcode.description')}</p>
	</Card>

	<Card href={`/scan/kvitto?from=${subFlowFrom}`} interactive class="tile">
		<span class="icon-wrap" aria-hidden="true">
			<FeatureIcon id="receipt" size={24} />
		</span>
		<h2>{t('scan.modes.receipt')}</h2>
		<p>{t('scan.modeTiles.receipt.description')}</p>
	</Card>

	<Card href={`/inventory/foto?from=${encodeURIComponent(subFlowFrom)}${locationQuery ? `&location=${defaultLocation}` : ''}`} interactive class="tile">
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
