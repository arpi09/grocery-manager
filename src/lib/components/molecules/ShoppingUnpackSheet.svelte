<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { LOCATIONS } from '$lib/domain/location';
	import type { UnpackRowInput } from '$lib/domain/shopping-unpack';
	import { getLocale, t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';

	interface Props {
		open: boolean;
		initialRows: UnpackRowInput[];
		onClose: () => void;
		onDone: (message: string) => void;
	}

	let { open, initialRows, onClose, onDone }: Props = $props();

	let rows = $state<UnpackRowInput[]>([]);
	let extraName = $state('');
	let submitting = $state(false);
	let initializedFor = $state<UnpackRowInput[] | null>(null);

	$effect(() => {
		if (open && initializedFor !== initialRows) {
			initializedFor = initialRows;
			rows = initialRows.map((row) => ({ ...row }));
			extraName = '';
		}
		if (!open) {
			initializedFor = null;
		}
	});

	function skipRow(index: number) {
		rows = rows.filter((_, i) => i !== index);
	}

	function addExtra() {
		const name = extraName.trim();
		if (!name) {
			return;
		}
		rows = [
			...rows,
			{ shoppingItemId: null, name, location: 'cupboard', quantity: '1', unit: null }
		];
		extraName = '';
	}

	function amountLabel(row: UnpackRowInput): string {
		return row.unit ? `${row.quantity} ${row.unit}` : row.quantity;
	}
</script>

<Modal
	{open}
	variant="sheet"
	title={t('shopping.v2.unpack.title')}
	subtitle={t('shopping.v2.unpack.subtitle', { count: rows.length })}
	onClose={onClose}
	data-testid="shopping-unpack-sheet"
>
	{#if rows.length > 0}
		<ul class="unpack-rows">
			{#each rows as row, index (row.shoppingItemId ?? `extra-${index}-${row.name}`)}
				<li>
					<div class="row-main">
						<span class="row-name">{row.name}</span>
						<span class="row-amount">{amountLabel(row)}</span>
					</div>
					<div class="row-controls">
						<label class="sr-only" for={`unpack-location-${index}`}>
							{t('common.place')}
						</label>
						<select id={`unpack-location-${index}`} bind:value={row.location}>
							{#each LOCATIONS as loc (loc)}
								<option value={loc}>{locationLabel(getLocale(), loc)}</option>
							{/each}
						</select>
						<button
							type="button"
							class="skip-link"
							onclick={() => skipRow(index)}
							aria-label={t('shopping.v2.unpack.skipRowAria', { name: row.name })}
						>
							{t('shopping.v2.unpack.skipRow')}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">{t('shopping.v2.unpack.empty')}</p>
	{/if}

	<div class="extra-row">
		<label class="sr-only" for="unpack-extra-name">{t('shopping.v2.unpack.addMoreLabel')}</label>
		<input
			id="unpack-extra-name"
			placeholder={t('shopping.v2.unpack.addMorePlaceholder')}
			bind:value={extraName}
			onkeydown={(event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					addExtra();
				}
			}}
		/>
		<Button type="button" variant="secondary" onclick={addExtra}>
			{t('shopping.v2.unpack.addMoreCta')}
		</Button>
	</div>

	<div class="actions">
		{#if rows.length > 0}
			<form
				method="POST"
				action="?/unpackAll"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						await update({ reset: false });
						submitting = false;
						if (result.type === 'success' && result.data && 'unpacked' in result.data) {
							const data = result.data as { unpacked?: { message?: string } };
							onDone(data.unpacked?.message ?? t('shopping.v2.unpack.doneToast', { count: rows.length }));
						}
					};
				}}
			>
				<input type="hidden" name="rows" value={JSON.stringify(rows)} />
				<Button
					type="submit"
					fullWidth
					loading={submitting}
					loadingLabel={t('common.saving')}
					data-testid="shopping-unpack-submit"
				>
					{t('shopping.v2.unpack.submit', { count: rows.length })}
				</Button>
			</form>
		{/if}
		<Button type="button" variant="ghost" fullWidth onclick={onClose}>
			{t('shopping.v2.unpack.notNow')}
		</Button>
	</div>
</Modal>

<style>
	.unpack-rows {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.unpack-rows li {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.unpack-rows li:last-child {
		border-bottom: none;
	}

	.row-main {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.row-name {
		font-weight: 600;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.row-amount {
		color: var(--color-text-muted);
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.row-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.row-controls select {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target-min);
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font: inherit;
		font-size: 0.875rem;
	}

	.skip-link {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-decoration: underline;
		cursor: pointer;
		min-height: var(--touch-target-min);
		flex-shrink: 0;
	}

	.skip-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.empty {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.extra-row {
		display: flex;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.extra-row input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target-min);
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
