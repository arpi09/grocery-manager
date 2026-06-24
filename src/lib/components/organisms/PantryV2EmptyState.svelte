<script lang="ts">
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref } from '$lib/utils/scan-nav';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';

	interface Props {
		canWrite?: boolean;
		returnTo?: string;
	}

	let { canWrite = false, returnTo = '/inventory' }: Props = $props();

	const scanHref = $derived(receiptOneTapHref(returnTo));
	const manualHref = $derived(manualAddHref(returnTo));
</script>

<div class="pantry-empty" data-testid="pantry-v2-empty">
	<EmptyState
		title={t('pantry.v2.empty.title')}
		description={t('pantry.v2.empty.body')}
		iconId="receipt"
		actionLabel={canWrite ? t('receiptAutomation.oneTapCta') : undefined}
		actionHref={canWrite ? scanHref : undefined}
		actionVariant="primary"
		secondaryActionLabel={canWrite ? t('pantry.v2.empty.cta') : undefined}
		secondaryActionHref={canWrite ? manualHref : undefined}
		primaryAnalyticsId="pantry.v2.empty_scan"
		secondaryAnalyticsId="pantry.v2.empty_add"
	/>
</div>

<style>
	.pantry-empty {
		display: flex;
		flex-direction: column;
	}
</style>
