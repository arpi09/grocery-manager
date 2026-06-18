<script lang="ts">
	import SearchInput from '$lib/components/molecules/SearchInput.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref, scanHubHref } from '$lib/utils/scan-nav';

	interface Props {
		query?: string;
		canWrite?: boolean;
		returnTo?: string;
	}

	let { query = $bindable(''), canWrite = false, returnTo = '/inventory' }: Props = $props();

	const scanHref = $derived(scanHubHref(returnTo));
	const addHref = $derived(manualAddHref(returnTo));
</script>

<div class="pantry-shelf-actions" data-testid="pantry-v2-actions">
	<label class="sr-only" for="pantry-v2-search">{t('pantry.v2.searchPlaceholder')}</label>
	<SearchInput id="pantry-v2-search" bind:value={query} placeholder={t('pantry.v2.searchPlaceholder')} />

	{#if canWrite}
		<div class="action-row">
			<a class="action-link" href={addHref} data-testid="pantry-v2-add">{t('pantry.v2.addCta')}</a>
			<a class="action-link" href={scanHref} data-testid="pantry-v2-scan">{t('pantry.v2.scanCta')}</a>
		</div>
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

	.action-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
	}

	.action-link:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
		text-decoration: none;
	}

	.action-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
