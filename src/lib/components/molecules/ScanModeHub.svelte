<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		returnTo: string;
		defaultLocation?: string;
	}

	let { returnTo, defaultLocation }: Props = $props();

	const from = $derived(encodeURIComponent(returnTo));
	const locationQuery = $derived(defaultLocation ? `&location=${defaultLocation}` : '');
	const barcodeHref = $derived(`/scan?mode=barcode&from=${from}${locationQuery}`);
</script>

<div class="hub" role="navigation" aria-label={t('scan.hubAria')}>
	<Card href={barcodeHref} interactive class="tile tile-primary">
		<span class="icon" aria-hidden="true">📷</span>
		<h2>{t('scan.modes.barcode.title')}</h2>
		<p>{t('scan.modes.barcode.description')}</p>
	</Card>
	<Card href={`/scan/kvitto?from=${from}`} interactive class="tile">
		<span class="icon" aria-hidden="true">🧾</span>
		<h2>{t('scan.modes.receipt.title')}</h2>
		<p>{t('scan.modes.receipt.description')}</p>
	</Card>
	<Card href={`/scan/foto?from=${from}${locationQuery}`} interactive class="tile">
		<span class="icon" aria-hidden="true">📸</span>
		<h2>{t('scan.modes.photo.title')}</h2>
		<p>{t('scan.modes.photo.description')}</p>
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
		border-color: var(--color-primary);
	}

	.icon {
		font-size: 1.75rem;
	}

	h2 {
		margin: 0;
		font-size: 1.05rem;
	}

	p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
