<script lang="ts">
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
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
		<Modal
			open={true}
			onClose={closeAddItem}
			variant="center"
			title="Add item"
			panelClass="add-item-panel"
		>
			<AddItemForm defaultLocation={data.defaultLocation} errors={form?.errors} />
		</Modal>
	{:else}
		<PageContainer>
			<div class="add-item-shell">
				<h1 class="title">Add item</h1>
				<AddItemForm defaultLocation={data.defaultLocation} errors={form?.errors} />
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

	:global(.add-item-panel) {
		width: min(680px, calc(100vw - 2 * var(--space-md)));
	}
</style>
