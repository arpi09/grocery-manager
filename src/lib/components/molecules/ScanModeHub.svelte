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

	let otherModesOpen = $state(false);

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

<div class="hub" data-testid="scan-mode-hub">
	<Card href={photoHref} interactive class="tile tile-primary" data-testid="scan-hub-photo-round">
		<span class="icon-wrap icon-wrap-primary" aria-hidden="true">
			<FeatureIcon id="photo" size={28} />
		</span>
		<h2>{t('photoRound.title')}</h2>
		<p>{t('scan.modeTiles.photoRound.description')}</p>
	</Card>

	<button
		type="button"
		class="other-modes-toggle"
		data-testid="scan-hub-other-modes"
		aria-expanded={otherModesOpen}
		onclick={() => (otherModesOpen = !otherModesOpen)}
	>
		{otherModesOpen ? t('scan.otherModesHide') : t('scan.otherModes')}
	</button>

	{#if otherModesOpen}
		<div class="other-modes" data-testid="scan-hub-other-modes-panel">
			<Card href={barcodeHref} interactive class="tile">
				<span class="icon-wrap" aria-hidden="true">
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
		</div>
	{/if}
</div>

<style>
	.hub {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.other-modes-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		margin: 0 auto;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		font: inherit;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
	}

	.other-modes-toggle:hover {
		color: var(--color-text);
	}

	.other-modes {
		display: grid;
		gap: var(--space-md);
	}

	@media (min-width: 560px) {
		.other-modes {
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
