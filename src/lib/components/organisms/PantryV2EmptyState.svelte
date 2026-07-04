<script lang="ts">
	import FirstRunEmptyState from '$lib/components/molecules/FirstRunEmptyState.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref } from '$lib/utils/scan-nav';

	interface Props {
		canWrite?: boolean;
		returnTo?: string;
	}

	let { canWrite = false, returnTo = '/inventory' }: Props = $props();

	const addHref = $derived(manualAddHref(returnTo));
</script>

<FirstRunEmptyState
	icon="🧺"
	title={t('pantry.v2.empty.title')}
	body={t('pantry.v2.empty.body')}
	ctaLabel={canWrite ? t('pantry.v2.empty.cta') : undefined}
	ctaHref={canWrite ? addHref : undefined}
	helperText={t('pantry.v2.empty.helper')}
	analyticsId="pantry.v2.empty_add"
	testid="pantry-v2-empty"
/>
