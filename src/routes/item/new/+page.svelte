<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';

	let { data, form } = $props();
</script>

<AppLayout>
	<PageContainer>
	<div class="add-item-shell">
		<div class="modal-card">
			<div class="modal-top">
				<h1 class="title">Add item</h1>
				<a class="close-btn" href={data.returnTo} aria-label="Close add item form">X</a>
			</div>
			<AddItemForm defaultLocation={data.defaultLocation} errors={form?.errors} />
		</div>
	</div>
	</PageContainer>
</AppLayout>

<style>
	.add-item-shell {
		display: block;
	}

	.modal-top {
		position: relative;
		margin-bottom: var(--space-lg);
	}

	.title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.close-btn {
		display: none;
	}

	@media (min-width: 769px) {
		.add-item-shell::before {
			content: '';
			position: fixed;
			inset: 0;
			background: rgba(31, 42, 36, 0.25);
			pointer-events: none;
		}

		.close-btn {
			position: absolute;
			top: 0.25rem;
			right: 0;
			width: 2rem;
			height: 2rem;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 999px;
			border: 1px solid var(--color-border);
			background: var(--color-surface);
			color: var(--color-text-muted);
			font-size: 1rem;
			text-decoration: none;
		}

		.close-btn:hover {
			background: var(--color-surface-muted);
			text-decoration: none;
		}

		.add-item-shell {
			position: relative;
			min-height: calc(100vh - 3rem);
			display: grid;
			place-items: center;
		}

		.modal-card {
			position: relative;
			z-index: 1;
			width: min(680px, 100%);
			padding: var(--space-lg);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			background: var(--color-surface);
			box-shadow: var(--shadow-md);
		}
	}
</style>
