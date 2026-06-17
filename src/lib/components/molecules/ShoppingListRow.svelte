<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import SkaffuListItem from '$lib/components/molecules/SkaffuListItem.svelte';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';
	import { getDeleteCopy } from '$lib/utils/delete-safety';

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

	let confirmingDelete = $state(false);

	const deleteCopy = $derived(getDeleteCopy(1, 'shoppingListItem', { itemName: item.name }));

	function openDeleteConfirm() {
		confirmingDelete = true;
	}

	function cancelDeleteConfirm() {
		confirmingDelete = false;
	}
</script>

<SkaffuListItem
	class="shopping-row{confirmingDelete ? ' confirming-delete' : ''}"
	{removing}
	checkedRow={checked}
	data-testid="shopping-row-{item.id}"
>
	{#if confirmingDelete && removeEnhance}
		<div
			class="delete-confirm-strip"
			role="group"
			aria-label={t('common.confirmDelete')}
			data-testid="shopping-delete-confirm-strip"
		>
			<p class="confirm-text">{deleteCopy.title}</p>
			<div class="confirm-actions">
				<Button type="button" variant="secondary" onclick={cancelDeleteConfirm}>
					{deleteCopy.cancelLabel}
				</Button>
				<form
					method="POST"
					action="?/remove"
					class="remove-form"
					use:enhance={(input) => {
						confirmingDelete = false;
						return removeEnhance(input);
					}}
				>
					<input type="hidden" name="id" value={item.id} />
					<Button type="submit" variant="danger" aria-label={t('common.confirmDelete')}>
						{deleteCopy.confirmLabel}
					</Button>
				</form>
			</div>
		</div>
	{:else if canEdit}
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
			<button
				type="button"
				class="remove-trigger"
				data-testid="shopping-delete-trigger"
				onclick={openDeleteConfirm}
				aria-label={t('shopping.removeLine', { line: lineLabel })}
			>
				×
			</button>
		{/if}
	{:else}
		<span class="line-readonly" class:done={checked}>{lineLabel}</span>
	{/if}
</SkaffuListItem>

<style>
	:global(.shopping-row.removing .mdc-deprecated-list-item__wrapper) {
		opacity: 0;
		transform: translateX(0.75rem);
		max-height: 0;
		margin: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-width: 0;
		overflow: hidden;
		pointer-events: none;
		transition:
			opacity 0.24s ease,
			transform 0.24s ease,
			max-height 0.24s ease,
			margin 0.24s ease,
			padding 0.24s ease;
	}

	:global(.shopping-row.checked-row .mdc-deprecated-list-item__wrapper) {
		opacity: 0.65;
		text-decoration: line-through;
	}

	:global(.shopping-row.confirming-delete .mdc-deprecated-list-item__wrapper) {
		flex-wrap: wrap;
		align-items: stretch;
	}

	.delete-confirm-strip {
		display: flex;
		flex: 1 1 100%;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
		min-width: 0;
		padding: var(--space-xs) 0;
	}

	.confirm-text {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 650;
		line-height: 1.35;
		color: var(--color-text);
	}

	.confirm-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.remove-form {
		margin: 0;
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
		font-size: 0.875rem;
		font-weight: 600;
	}

	.line-readonly {
		flex: 1;
		min-width: 0;
		line-height: 1.35;
		font-size: 0.875rem;
	}

	.line-readonly.done {
		opacity: 0.65;
		text-decoration: line-through;
	}

	.remove-trigger {
		flex-shrink: 0;
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
		cursor: pointer;
		font-family: inherit;
		border-radius: var(--radius-sm);
	}

	.remove-trigger:hover {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}
</style>
