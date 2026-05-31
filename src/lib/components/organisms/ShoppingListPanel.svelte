<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { t } from '$lib/i18n';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { getDeleteCopy } from '$lib/utils/delete-safety';
	import {
		formatShoppingListExport,
		formatShoppingListExportLine
	} from '$lib/utils/shopping-list-export';

	let { items, canEdit }: { items: ShoppingListItem[]; canEdit: boolean } = $props();

	const unchecked = $derived(items.filter((item) => !item.checked));
	const checked = $derived(items.filter((item) => item.checked));

	let undoPayload = $state<{
		name: string;
		quantity: string | null;
		unit: string | null;
	} | null>(null);
	let undoSubmitting = $state(false);
	let exportCopied = $state(false);

	const undoCopy = $derived(getDeleteCopy(1, 'shoppingListItem'));
	const undoMessage = $derived(
		undoPayload
			? getDeleteCopy(1, 'shoppingListItem', { itemName: undoPayload.name }).undoToastMessage ??
					t('delete.shoppingItem.undo')
			: ''
	);

	function formatLine(item: ShoppingListItem): string {
		return formatShoppingListExportLine(item);
	}

	async function copyExportList() {
		const text = formatShoppingListExport(items);
		if (!text) {
			return;
		}
		await navigator.clipboard.writeText(text);
		exportCopied = true;
		setTimeout(() => {
			exportCopied = false;
		}, 2000);
	}

	function createRemoveEnhance(item: ShoppingListItem): SubmitFunction {
		return () => {
			const snapshot = {
				name: item.name,
				quantity: item.quantity,
				unit: item.unit
			};
			return async ({ update }) => {
				await update();
				undoPayload = snapshot;
			};
		};
	}

	async function undoRemove() {
		if (!undoPayload) {
			return;
		}
		undoSubmitting = true;
		const formData = new FormData();
		formData.set('name', undoPayload.name);
		if (undoPayload.quantity) {
			formData.set('quantity', undoPayload.quantity);
		}
		if (undoPayload.unit) {
			formData.set('unit', undoPayload.unit);
		}
		try {
			await fetch('?/add', { method: 'POST', body: formData });
			undoPayload = null;
			await invalidateAll();
		} finally {
			undoSubmitting = false;
		}
	}

	

	function dismissUndo() {
		undoPayload = null;
	}
</script>

<section class="panel" aria-label={t('shopping.listAria')}>
	<div class="panel-head">
		<p class="intro">{t('shopping.intro')}</p>
		{#if items.length > 0}
			<Button
				type="button"
				variant="secondary"
				disabled={unchecked.length === 0}
				aria-label={unchecked.length === 0 ? t('shopping.exportEmpty') : t('shopping.exportListAria')}
				onclick={copyExportList}
			>
				{exportCopied ? t('common.copied') : t('shopping.exportList')}
			</Button>
		{/if}
	</div>

	{#if canEdit}
		<form method="POST" action="?/add" use:enhance class="add-form">
			<label class="label" for="shopping-name">{t('shopping.addLabel')}</label>
			<div class="add-row">
				<input id="shopping-name" name="name" required maxlength="200" placeholder={t('shopping.itemPlaceholder')} />
				<input name="quantity" inputmode="decimal" placeholder={t('shopping.quantityPlaceholder')} aria-label={t('shopping.quantityPlaceholder')} />
				<input name="unit" maxlength="40" placeholder={t('shopping.unitPlaceholder')} aria-label={t('shopping.unitPlaceholder')} />
				<Button type="submit">{t('shopping.addLabel')}</Button>
			</div>
		</form>
	{:else}
		<p class="readonly">{t('inventory.readonly')}</p>
	{/if}

	{#if items.length === 0}
		<p class="empty">{t('shopping.emptyList')}</p>
	{:else}
		<ul class="list">
			{#each unchecked as item (item.id)}
				<li>
					{#if canEdit}
						<form method="POST" action="?/toggle" data-sveltekit-reload class="row-form">
							<input type="hidden" name="id" value={item.id} />
							<label class="check-row">
								<input type="checkbox" onchange={(e) => e.currentTarget.form?.requestSubmit()} />
								<span>{formatLine(item)}</span>
							</label>
						</form>
						<DeleteConfirmButton
							tier={1}
							context="shoppingListItem"
							copyOptions={{ itemName: item.name }}
							action="?/remove"
							submitEnhance={createRemoveEnhance(item)}
							label="×"
							ariaLabel={t('shopping.removeLine', { line: formatLine(item) })}
							class="remove-trigger"
						>
							<input type="hidden" name="id" value={item.id} />
						</DeleteConfirmButton>
					{:else}
						<span>{formatLine(item)}</span>
					{/if}
				</li>
			{/each}
		</ul>

		{#if checked.length > 0}
			<div class="checked-block">
				<div class="checked-head">
					<h2>{t('shopping.checkedHeading')}</h2>
					{#if canEdit}
						<DeleteConfirmButton
							tier={3}
							context="shoppingListClearChecked"
							copyOptions={{ count: checked.length }}
							action="?/clearChecked"
							variant="secondary"
							label={t('delete.clearChecked.confirm')}
							ariaLabel={t('shopping.clearCheckedAria')}
						/>
					{/if}
				</div>
				<ul class="list checked">
					{#each checked as item (item.id)}
						<li>
							{#if canEdit}
								<form method="POST" action="?/toggle" data-sveltekit-reload class="row-form">
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

{#if undoPayload}
	<div class="undo-toast-wrap">
		<Toast message={undoMessage ?? ''} visible={true} durationMs={8000} onDismiss={dismissUndo} />
		<button
			type="button"
			class="undo-btn"
			disabled={undoSubmitting}
			onclick={undoRemove}
			aria-label={undoCopy.undoActionLabel ?? t('common.undo')}
		>
			{undoCopy.undoActionLabel ?? t('common.undo')}
		</button>
	</div>
{/if}

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

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.panel-head .intro {
		flex: 1;
		min-width: 12rem;
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

	:global(.remove-trigger .btn) {
		border: none;
		background: transparent;
		font-size: 1.25rem;
		line-height: 1;
		padding: 0.15rem 0.35rem;
		min-height: auto;
		color: var(--color-text-muted);
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
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

	.undo-toast-wrap {
		position: fixed;
		left: 50%;
		bottom: calc(var(--space-lg) + env(safe-area-inset-bottom, 0px));
		transform: translateX(-50%);
		z-index: 121;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.undo-btn {
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.45rem 0.75rem;
		font-weight: 600;
		font-size: 0.85rem;
		background: #fff;
		color: var(--color-text);
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.undo-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.panel {
			padding: var(--space-sm);
		}

		.panel-head {
			flex-direction: column;
			align-items: stretch;
		}

		.panel-head :global(.btn) {
			width: 100%;
			min-height: 2.75rem;
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

		:global(.remove-trigger .btn) {
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
