<script lang="ts">
	import FirstRunEmptyState from '$lib/components/molecules/FirstRunEmptyState.svelte';
	import { t } from '$lib/i18n';
	import { manualAddHref, scanHubHref } from '$lib/utils/scan-nav';

	interface Props {
		canWrite?: boolean;
		returnTo?: string;
	}

	let { canWrite = false, returnTo = '/inventory' }: Props = $props();

	/* Scan-first: the fastest way to a living pantry is a receipt or photo, not a form. */
	const scanHref = $derived(scanHubHref(returnTo));
	const addHref = $derived(manualAddHref(returnTo));
</script>

<FirstRunEmptyState
	icon="🧺"
	title={t('pantry.v2.empty.title')}
	body={t('pantry.v2.empty.body')}
	ctaLabel={canWrite ? t('pantry.v2.empty.scanCta') : undefined}
	ctaHref={canWrite ? scanHref : undefined}
	secondaryLabel={canWrite ? t('pantry.v2.empty.manualLink') : undefined}
	secondaryHref={canWrite ? addHref : undefined}
	helperText={t('pantry.v2.empty.helper')}
	analyticsId="pantry.v2.empty_add"
	testid="pantry-v2-empty"
/>
