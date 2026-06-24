<script lang="ts">
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { canAccessCamera, BARCODE_HTTPS_HINT } from '$lib/utils/device';

	interface Props {
		onclick?: () => void;
		loading?: boolean;
	}

	let { onclick, loading = false }: Props = $props();

	let needsHttps = $state(false);

	onMount(() => {
		needsHttps = !canAccessCamera();
	});
</script>

{#if needsHttps}
	<p class="https-hint" role="note">{BARCODE_HTTPS_HINT}</p>
{/if}

<Button
	type="button"
	variant="secondary"
	class="scan-btn"
	loading={loading}
	loadingLabel={t('common.lookup')}
	onclick={onclick}
	aria-label={t('scanFlow.barcodeCamera')}
>
	<FeatureIcon id="barcode" size={18} />
	{t('scanFlow.barcodeFab')}
</Button>

<style>
	.https-hint {
		margin: 0 0 var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: color-mix(in srgb, var(--color-accent) 18%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-accent) 40%, var(--color-border));
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: color-mix(in srgb, var(--color-text) 70%, var(--color-warning));
		line-height: 1.4;
	}

	:global(.scan-btn) {
		width: 100%;
	}
</style>
