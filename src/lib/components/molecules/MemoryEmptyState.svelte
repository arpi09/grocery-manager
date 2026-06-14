<script lang="ts">
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	interface Props {
		hasReceiptData: boolean;
	}

	let { hasReceiptData }: Props = $props();
</script>

<div data-testid="memory-empty-state">
	<EmptyState
		iconId="receipt"
		title={t('memory.empty.title')}
		description={hasReceiptData
			? `${t('memory.empty.description')} ${t('memory.empty.receiptHint')}`
			: t('memory.empty.description')}
		actionLabel={t('memory.empty.scanCta')}
		actionHref={scanHubHref('/settings/memory')}
		primaryAnalyticsId="memory.empty_scan"
		secondaryActionLabel={t('memory.empty.inventoryCta')}
		secondaryActionHref="/inventory"
		secondaryAnalyticsId="memory.empty_inventory"
	/>
	<p class="trust-note">{t('memory.empty.trustNote')}</p>
</div>

<style>
	.trust-note {
		margin: var(--space-md) 0 0;
		text-align: center;
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
		color: var(--color-text-muted);
		max-width: 36ch;
		margin-inline: auto;
	}
</style>
