<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';
	import { buildPantryShelfView } from '$lib/domain/pantry-shelf';
	import { t } from '$lib/i18n';

	let { data } = $props();

	const shelf = $derived(buildPantryShelfView(data.items));
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('pantry.v2.title')} />

	<PageContainer>
		<PantryV2ShelfView {shelf} />
	</PageContainer>
</AppLayout>
