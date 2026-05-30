<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import InkopAssistant from '$lib/components/organisms/InkopAssistant.svelte';
	import ShoppingListPanel from '$lib/components/organisms/ShoppingListPanel.svelte';

	let { data } = $props();

	type InkopTab = 'list' | 'assistant';
	let activeTab = $state<InkopTab>('list');
</script>

<AppLayout user={data.user}>
	<AppHeader title="Inköp" subtitle="Gemensam inköpslista och AI-hjälp" />
	<PageContainer>
		<div class="tabs" role="tablist" aria-label="Inköp">
			<button
				type="button"
				class:active={activeTab === 'list'}
				role="tab"
				aria-selected={activeTab === 'list'}
				onclick={() => (activeTab = 'list')}
			>
				Inköpslista
			</button>
			<button
				type="button"
				class:active={activeTab === 'assistant'}
				role="tab"
				aria-selected={activeTab === 'assistant'}
				onclick={() => (activeTab = 'assistant')}
			>
				AI & ICA
			</button>
		</div>

		{#if activeTab === 'list'}
			<ShoppingListPanel items={data.items} canEdit={data.canEdit} />
		{:else}
			<InkopAssistant />
		{/if}
	</PageContainer>
</AppLayout>

<style>
	.tabs {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-bottom: var(--space-md);
	}

	.tabs button {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		font-weight: 600;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.tabs button.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	@media (max-width: 640px) {
		.tabs {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--space-xs);
		}

		.tabs button {
			min-height: 2.75rem;
			padding: 0.5rem 0.65rem;
			font-size: 0.875rem;
			text-align: center;
		}
	}
</style>
