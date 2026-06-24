<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PantryWrappedFlow from '$lib/components/organisms/PantryWrappedFlow.svelte';
	import { getLocale, t } from '$lib/i18n';
	import { parseWrappedMonthParam } from '$lib/domain/wrapped';

	let { data } = $props();

	const monthLabel = $derived(
		parseWrappedMonthParam(data.report.monthKey).toLocaleDateString(
			getLocale() === 'sv' ? 'sv-SE' : 'en-GB',
			{ month: 'long', year: 'numeric' }
		)
	);
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('wrapped.pageTitle')}
		subtitle={t('wrapped.pageSubtitle')}
		backFallback="/statistik"
		backLabel={t('wrapped.backToStats')}
	/>
	<PageContainer>
		<PantryWrappedFlow report={data.report} {monthLabel} />
	</PageContainer>
</AppLayout>
