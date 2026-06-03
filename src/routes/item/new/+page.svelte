<script lang="ts">

	import { goto } from '$app/navigation';

	import { t } from '$lib/i18n';

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

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

		<PageContainer>

			<div class="add-item-shell">

				<h1 class="title">{t('item.addTitle')}</h1>

				<AddItemForm defaultLocation={data.defaultLocation} returnTo={data.returnTo} errors={form?.errors} />

			</div>

		</PageContainer>

	{/if}

</AppLayout>



<style>

	.add-item-shell {

		display: block;

	}



	.title {

		margin: 0 0 var(--space-lg);

		font-size: 1.5rem;

		font-weight: 700;

	}

</style>

