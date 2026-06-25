<script lang="ts">
	import ScanHubIllustration from '$lib/components/molecules/ScanHubIllustration.svelte';
	import { t, type MessageKey } from '$lib/i18n';
	import { manualAddHref, scanModeHref, type DirectScanMode } from '$lib/utils/scan-nav';
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

	const scanModes: DirectScanMode[] = ['receipt', 'photo', 'barcode'];

	const modeLabels: Record<DirectScanMode, MessageKey> = {
		receipt: 'scan.choiceHub.receipt',
		photo: 'scan.choiceHub.photo',
		barcode: 'scan.choiceHub.barcode'
	};

	const aiModes = new Set<DirectScanMode>(['receipt', 'photo']);

	const manualHref = $derived(manualAddHref(returnTo, locationOption));

	function hrefForMode(mode: DirectScanMode): string {
		return scanModeHref(mode, returnTo, locationOption);
	}

	function testIdForMode(mode: DirectScanMode): string {
		return `scan-hub-${mode === 'photo' ? 'photo' : mode}`;
	}

	function variantForMode(mode: DirectScanMode): 'receipt' | 'photo' | 'barcode' {
		return mode === 'receipt' ? 'receipt' : mode === 'barcode' ? 'barcode' : 'photo';
	}
</script>

<div class="hub" data-testid="scan-mode-hub">
	<h2 class="hub-title">{t('scan.choiceHub.title')}</h2>

	<div class="choice-grid" role="list">
		{#each scanModes as mode (mode)}
			<a
				class="choice-card"
				href={hrefForMode(mode)}
				data-testid={testIdForMode(mode)}
				role="listitem"
			>
				<span class="icon-wrap" aria-hidden="true">
					<ScanHubIllustration variant={variantForMode(mode)} />
				</span>
				<span class="choice-label">
					{t(modeLabels[mode])}
					{#if aiModes.has(mode)}
						<span class="ai-badge">AI</span>
					{/if}
				</span>
			</a>
		{/each}
	</div>

	<a class="text-action manual-link" href={manualHref} data-testid="scan-hub-manual">
		{t('scan.choiceHub.manualLink')}
	</a>
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
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-xs);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		line-height: 1.35;
	}

	.ai-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.35rem;
		border-radius: var(--radius-sm);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--color-learning-ai);
		background: color-mix(in srgb, var(--color-learning-ai) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-learning-ai) 30%, var(--color-border));
	}

	.manual-link {
		align-self: flex-start;
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
