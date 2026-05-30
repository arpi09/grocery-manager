<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { enhance } from '$app/forms';

	let { items, canEdit }: { items: ShoppingListItem[]; canEdit: boolean } = $props();

	const unchecked = $derived(items.filter((item) => !item.checked));
	const checked = $derived(items.filter((item) => item.checked));

	function formatLine(item: ShoppingListItem): string {
		if (item.quantity && item.unit) return `${item.quantity} ${item.unit} ${item.name}`;
		if (item.quantity) return `${item.quantity} ${item.name}`;
		return item.name;
	}
</script>

<section class="panel" aria-label="Inköpslista">
	<p class="intro">Gemensam lista för hushållet. Alla med redigeringsbehörighet kan uppdatera den.</p>

	{#if canEdit}
		<form method="POST" action="?/add" use:enhance class="add-form">
			<label class="label" for="shopping-name">Lägg till</label>
			<div class="add-row">
				<input id="shopping-name" name="name" required maxlength="200" placeholder="Vara" />
				<input name="quantity" inputmode="decimal" placeholder="Antal" aria-label="Antal" />
				<input name="unit" maxlength="40" placeholder="Enhet" aria-label="Enhet" />
				<Button type="submit">Lägg till</Button>
			</div>
		</form>
	{:else}
		<p class="readonly">Du har endast läsbehörighet i detta hushåll.</p>
	{/if}

	{#if items.length === 0}
		<p class="empty">Listan är tom.</p>
	{:else}
		<ul class="list">
			{#each unchecked as item (item.id)}
				<li>
					{#if canEdit}
						<form method="POST" action="?/toggle" use:enhance class="row-form">
							<input type="hidden" name="id" value={item.id} />
							<label class="check-row">
								<input type="checkbox" onchange={(e) => e.currentTarget.form?.requestSubmit()} />
								<span>{formatLine(item)}</span>
							</label>
						</form>
						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="id" value={item.id} />
							<button type="submit" class="remove" aria-label="Ta bort">×</button>
						</form>
					{:else}
						<span>{formatLine(item)}</span>
					{/if}
				</li>
			{/each}
		</ul>

		{#if checked.length > 0}
			<div class="checked-block">
				<div class="checked-head">
					<h2>Avbockade</h2>
					{#if canEdit}
						<form method="POST" action="?/clearChecked" use:enhance>
							<Button type="submit" variant="secondary">Rensa avbockade</Button>
						</form>
					{/if}
				</div>
				<ul class="list checked">
					{#each checked as item (item.id)}
						<li>
							{#if canEdit}
								<form method="POST" action="?/toggle" use:enhance class="row-form">
									<input type="hidden" name="id" value={item.id} />
									<label class="check-row">
										<input type="checkbox" checked onchange={(e) => e.currentTarget.form?.requestSubmit()} />
										<span>{formatLine(item)}</span>
									</label>
								</form>
							{:else}
								<span class="done">{formatLine(item)}</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.intro,
	.empty,
	.readonly {
		margin: 0;
		color: var(--color-text-muted);
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.label {
		font-weight: 600;
	}

	.add-row {
		display: grid;
		grid-template-columns: 1fr 5rem 5rem auto;
		gap: var(--space-sm);
	}

	.add-row input {
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.65rem;
		background: var(--color-surface-muted);
	}

	.list.checked li {
		opacity: 0.65;
		text-decoration: line-through;
	}

	.row-form {
		flex: 1;
		margin: 0;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
	}

	.remove {
		border: none;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.checked-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.checked-head h2 {
		margin: 0;
		font-size: 1rem;
	}

	@media (max-width: 640px) {
		.panel {
			padding: var(--space-sm);
		}

		.add-row {
			grid-template-columns: 1fr 1fr;
		}

		.add-row input:first-of-type {
			grid-column: 1 / -1;
		}

		.add-row input {
			min-width: 0;
			min-height: 2.75rem;
			width: 100%;
		}

		.add-row :global(.btn) {
			grid-column: 1 / -1;
			width: 100%;
			min-height: 2.75rem;
		}

		.list li {
			min-height: 2.75rem;
		}

		.check-row {
			min-height: 2.75rem;
		}

		.remove {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 2.75rem;
			min-height: 2.75rem;
		}

		.checked-head {
			flex-direction: column;
			align-items: stretch;
		}

		.checked-head :global(.btn) {
			width: 100%;
			min-height: 2.75rem;
		}
	}
</style>
