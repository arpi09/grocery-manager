<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import InventoryAddSheet from '$lib/components/molecules/InventoryAddSheet.svelte';
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';

	interface Props {
		query?: string;
		canWrite?: boolean;
		returnTo?: string;
	}

	let { query = $bindable(''), canWrite = false, returnTo = '/inventory' }: Props = $props();

	let addSheetOpen = $state(false);

	const receiptHref = $derived(scanModeHref('receipt', returnTo));
	const photoHref = $derived(scanModeHref('photo', returnTo));
	const barcodeHref = $derived(scanModeHref('barcode', returnTo));
	const manualHref = $derived(manualAddHref(returnTo));
</script>

<div class="pantry-shelf-actions" data-testid="pantry-v2-actions">
	<label class="sr-only" for="pantry-v2-search">{t('pantry.v2.searchPlaceholder')}</label>
	<SearchInput id="pantry-v2-search" bind:value={query} placeholder={t('pantry.v2.searchPlaceholder')} />

	{#if canWrite}
		<div class="action-row">
			<Button
				type="button"
				variant="primary"
				onclick={() => (addSheetOpen = true)}
				data-testid="pantry-v2-add"
			>
				{t('pantry.v2.addCta')}
			</Button>
		</div>

		<InventoryAddSheet
			open={addSheetOpen}
			receiptHref={receiptHref}
			photoHref={photoHref}
			barcodeHref={barcodeHref}
			manualHref={manualHref}
			onClose={() => (addSheetOpen = false)}
		/>
	{/if}
</div>

<style>
	.pantry-shelf-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--page-section-gap, var(--space-lg));
		min-width: 0;
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
