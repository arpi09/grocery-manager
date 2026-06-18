<script lang="ts">
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref, scanModeHref } from '$lib/utils/scan-nav';

	interface Props {
		canWrite?: boolean;
		returnTo?: string;
	}

	let { canWrite = false, returnTo = '/inventory' }: Props = $props();

	const scanHref = $derived(scanModeHref('receipt', returnTo));
	const addHref = $derived(manualAddHref(returnTo));
</script>

<div data-testid="pantry-v2-empty">
	<EmptyState
		iconId="receipt"
		title={t('pantry.v2.empty.title')}
		description={t('pantry.v2.empty.body')}
		actionLabel={canWrite ? t('pantry.v2.empty.cta') : undefined}
		actionHref={canWrite ? scanHref : undefined}
		secondaryActionLabel={canWrite ? t('pantry.v2.addCta') : undefined}
		secondaryActionHref={canWrite ? addHref : undefined}
	/>
</div>
