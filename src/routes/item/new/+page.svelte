<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import AddItemModalOverlay from '$lib/components/organisms/AddItemModalOverlay.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';

	let { data, form } = $props();

	let isDesktopModal = $state(false);

	$effect(() => {
		const query = window.matchMedia('(min-width: 769px)');
		const update = () => {
			isDesktopModal = query.matches;
		};
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	function closeAddItem() {
		void goto(data.returnTo);
	}
</script>

<AppLayout>
	{#if isDesktopModal}
		<AddItemModalOverlay
			defaultLocation={data.defaultLocation}
			returnTo={data.returnTo}
			errors={form?.errors}
			onClose={closeAddItem}
		/>
	{:else}
		<AppHeader
			title={t('item.addTitle')}
			backHref={data.returnTo}
			backLabel={t('common.cancel')}
		/>
		<PageContainer>
			<AddItemForm
				defaultLocation={data.defaultLocation}
				returnTo={data.returnTo}
				errors={form?.errors}
			/>
		</PageContainer>
	{/if}
</AppLayout>
