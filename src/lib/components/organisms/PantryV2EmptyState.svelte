<script lang="ts">
	import SceneIllustration from '$lib/components/atoms/SceneIllustration.svelte';
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

<div class="pantry-empty" data-testid="pantry-v2-empty">
	<SceneIllustration src="/illustrations/v2/pantry-shelf.svg" decorative />

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

<style>
	.pantry-empty {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
</style>
