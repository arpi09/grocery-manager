<script lang="ts">
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';
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
	const manualHref = $derived(manualAddHref(returnTo, locationOption));
</script>

<div class="hub" data-testid="scan-mode-hub">
	<h2 class="hub-title">{t('scan.choiceHub.title')}</h2>

	<nav class="choice-grid" aria-label={t('scan.choiceHub.title')}>
		<a class="choice-card choice-card--primary" href={receiptHref} data-testid="scan-hub-receipt">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="receipt" size={22} />
			</span>
			<span class="choice-label">{t('scan.choiceHub.receipt')}</span>
		</a>

		<a class="choice-card" href={photoHref} data-testid="scan-hub-photo">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="photo" size={22} />
			</span>
			<span class="choice-label">{t('scan.choiceHub.photo')}</span>
		</a>

		<a class="choice-card" href={barcodeHref} data-testid="scan-hub-barcode">
			<span class="icon-wrap" aria-hidden="true">
				<FeatureIcon id="barcode" size={22} />
			</span>
			<span class="choice-label">{t('scan.choiceHub.barcode')}</span>
		</a>
	</nav>

	<a class="manual-link" href={manualHref} data-testid="scan-hub-manual">{t('scan.choiceHub.manualLink')}</a>
</div>

<style>
	.hub {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.hub-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 650;
		line-height: 1.25;
	}

	.choice-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.choice-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: var(--touch-target-min);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		text-decoration: none;
		color: var(--color-text);
	}

	.choice-card--primary {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.choice-label {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		line-height: 1.35;
	}

	.manual-link {
		align-self: flex-start;
		min-height: var(--touch-target-min);
		display: inline-flex;
		align-items: center;
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}
</style>
