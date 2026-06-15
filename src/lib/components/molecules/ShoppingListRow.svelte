<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		item: ShoppingListItem;
		canEdit: boolean;
		checked?: boolean;
		removing?: boolean;
		lineLabel: string;
		toggleEnhance: SubmitFunction;
		removeEnhance?: SubmitFunction;
	}

	let {
		item,
		canEdit,
		checked = false,
		removing = false,
		lineLabel,
		toggleEnhance,
		removeEnhance
	}: Props = $props();
</script>

<li class="shopping-row product-row" class:removing class:checked-row={checked}>
	{#if canEdit}
		<form
			method="POST"
			action="?/toggle"
			class="row-form store-mode"
			use:enhance={toggleEnhance}
		>
			<input type="hidden" name="id" value={item.id} />
			<label class="check-row">
				<input
					type="checkbox"
					class="store-checkbox"
					{checked}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				/>
				<span class="line-text">{lineLabel}</span>
			</label>
		</form>
		{#if !checked && removeEnhance}
			<DeleteConfirmButton
				tier={1}
				context="shoppingListItem"
				copyOptions={{ itemName: item.name }}
				action="?/remove"
				variant="ghost"
				submitEnhance={removeEnhance}
				label="×"
				ariaLabel={t('shopping.removeLine', { line: lineLabel })}
				class="remove-trigger"
			>
				<input type="hidden" name="id" value={item.id} />
			</DeleteConfirmButton>
		{/if}
	{:else}
		<span class="line-readonly" class:done={checked}>{lineLabel}</span>
	{/if}
</li>

<style>
	.shopping-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface);
		transition:
			opacity 0.24s ease,
			transform 0.24s ease,
			max-height 0.24s ease,
			margin 0.24s ease,
			padding 0.24s ease;
	}

	.shopping-row.removing {
		opacity: 0;
		transform: translateX(0.75rem);
		max-height: 0;
		margin: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-width: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.shopping-row.checked-row {
		opacity: 0.65;
		text-decoration: line-through;
	}

	.row-form {
		flex: 1;
		margin: 0;
		min-width: 0;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
		min-height: var(--touch-target-min);
		width: 100%;
	}

	.store-checkbox {
		flex-shrink: 0;
		width: var(--touch-target-min);
		height: var(--touch-target-min);
		margin: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.line-text {
		flex: 1;
		min-width: 0;
		line-height: 1.35;
	}

	.line-readonly {
		flex: 1;
		min-width: 0;
		line-height: 1.35;
	}

	.line-readonly.done {
		opacity: 0.65;
		text-decoration: line-through;
	}

	:global(.remove-trigger) {
		grid-column: 2;
		flex-shrink: 0;
	}

	:global(.remove-trigger .btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0.35rem 0.5rem;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		color: var(--color-text-muted);
	}
</style>
