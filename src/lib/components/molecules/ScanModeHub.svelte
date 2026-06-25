<script lang="ts">
	import ScanHubIllustration from '$lib/components/molecules/ScanHubIllustration.svelte';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		getLastScanMode,
		manualAddHref,
		scanModeHref,
		type ScanMode
	} from '$lib/utils/scan-nav';
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

	const featuredMode = $derived(getLastScanMode());

	const modeLabels: Record<Exclude<ScanMode, 'hub'>, MessageKey> = {
		receipt: 'scan.choiceHub.receipt',
		photo: 'scan.choiceHub.photo',
		barcode: 'scan.choiceHub.barcode'
	};

	const featuredHref = $derived(scanModeHref(featuredMode, returnTo, locationOption));

	const featuredLabel = $derived(t(modeLabels[featuredMode]));

	const featuredVariant = $derived(
		featuredMode === 'receipt' ? 'receipt' : featuredMode === 'barcode' ? 'barcode' : 'photo'
	);

	const otherModes = $derived(
		(['receipt', 'photo', 'barcode'] as const).filter((mode) => mode !== featuredMode)
	);

	const manualHref = $derived(manualAddHref(returnTo, locationOption));

	function hrefForMode(mode: Exclude<ScanMode, 'hub'>): string {
		return scanModeHref(mode, returnTo, locationOption);
	}

	function testIdForMode(mode: Exclude<ScanMode, 'hub'>): string {
		return `scan-hub-${mode === 'photo' ? 'photo' : mode}`;
	}
</script>

<div class="hub" data-testid="scan-mode-hub">
	<h2 class="hub-title">{t('scan.choiceHub.title')}</h2>

	<a
		class="choice-card choice-card--primary"
		href={featuredHref}
		data-testid={testIdForMode(featuredMode as Exclude<ScanMode, 'hub'>)}
	>
		<span class="icon-wrap" aria-hidden="true">
			<ScanHubIllustration variant={featuredVariant} />
		</span>
		<span class="choice-label">{featuredLabel}</span>
	</a>

	<nav class="other-links" aria-label={t('scan.choiceHub.otherModesAria')}>
		{#each otherModes as mode (mode)}
			<a class="text-action" href={hrefForMode(mode)} data-testid={testIdForMode(mode)}>
				{t(modeLabels[mode])}
			</a>
		{/each}
		<a class="text-action" href={manualHref} data-testid="scan-hub-manual">
			{t('scan.choiceHub.manualLink')}
		</a>
	</nav>
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

	.choice-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: var(--touch-target-min);
		padding: var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		text-decoration: none;
		color: var(--color-text);
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
		overflow: hidden;
	}

	.choice-label {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		line-height: 1.35;
	}

	.other-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
	}

	.text-action {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.5rem;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
