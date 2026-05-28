<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
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
	disabled={loading}
	onclick={onclick}
	aria-label="Scan barcode with camera"
>
	{#if loading}
		Looking up…
	{:else}
		📷 Scan barcode
	{/if}
</Button>

<style>
	.https-hint {
		margin: 0 0 var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: #fff8e6;
		border: 1px solid #f0d2a8;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		color: #8a5a12;
		line-height: 1.4;
	}

	:global(.scan-btn) {
		width: 100%;
	}
</style>
