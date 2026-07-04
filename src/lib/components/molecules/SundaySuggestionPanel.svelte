<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { SundaySuggestion } from '$lib/domain/sunday-suggestion';
	import { t } from '$lib/i18n';

	interface Props {
		proposal: SundaySuggestion[];
		canEdit: boolean;
		/** row.key currently being added (per-row spinner). */
		addingKey?: string | null;
		addingAll?: boolean;
		dismissingKey?: string | null;
		onAdd: (row: SundaySuggestion) => void | Promise<void>;
		onAddAll: (rows: SundaySuggestion[]) => void | Promise<void>;
		onDismiss: (row: SundaySuggestion) => void | Promise<void>;
	}

	let {
		proposal,
		canEdit,
		addingKey = null,
		addingAll = false,
		dismissingKey = null,
		onAdd,
		onAddAll,
		onDismiss
	}: Props = $props();

	/* Session-local hide for tapped/dismissed rows, so the panel updates instantly before the
	 * server round-trip lands. Rows that are added drop out on reload anyway (deduped vs list). */
	let hidden = $state(new Set<string>());

	const visible = $derived(proposal.filter((row) => !hidden.has(row.key)));
	const busy = $derived(Boolean(addingKey) || addingAll || Boolean(dismissingKey));

	function handleAdd(row: SundaySuggestion) {
		if (busy) return;
		void onAdd(row);
	}

	function handleAddAll() {
		if (busy || visible.length === 0) return;
		void onAddAll(visible);
	}

	function handleDismiss(row: SundaySuggestion) {
		if (busy) return;
		hidden = new Set(hidden).add(row.key);
		void onDismiss(row);
	}
</script>

{#if visible.length > 0}
	<section class="sunday" aria-labelledby="sunday-heading" data-testid="sunday-suggestion-panel">
		<header class="sunday-header">
			<div class="sunday-copy">
				<h2 id="sunday-heading" class="sunday-title">{t('shopping.sunday.heading')}</h2>
				<p class="sunday-subtitle">{t('shopping.sunday.subtitle')}</p>
			</div>
			{#if canEdit && visible.length > 1}
				<Button
					variant="secondary"
					loading={addingAll}
					disabled={busy}
					onclick={handleAddAll}
					aria-label={t('shopping.sunday.addAllAria', { count: visible.length })}
				>
					{t('shopping.sunday.addAll')}
				</Button>
			{/if}
		</header>

		<ul class="sunday-list" data-testid="sunday-suggestion-list">
			{#each visible as row (row.key)}
				<li class="sunday-row" data-testid="sunday-row-{row.key}">
					<div class="sunday-row-copy">
						<p class="sunday-name">
							{row.name}{#if row.quantityLabel}<span class="sunday-qty"> · {row.quantityLabel}</span>{/if}
						</p>
						<p class="sunday-reason">
							{#if row.reason.kind === 'i18n'}
								{t(row.reason.key, row.reason.params)}
							{:else}
								{row.reason.text}
							{/if}
						</p>
					</div>
					{#if canEdit}
						<div class="sunday-actions">
							<Button
								variant="ghost"
								disabled={busy}
								onclick={() => handleDismiss(row)}
								aria-label={t('shopping.sunday.dismissAria', { name: row.name })}
							>
								{t('shopping.sunday.dismiss')}
							</Button>
							<Button
								variant="secondary"
								loading={addingKey === row.key}
								disabled={busy}
								onclick={() => handleAdd(row)}
								aria-label={t('shopping.sunday.addAria', { name: row.name })}
							>
								{t('shopping.sunday.add')}
							</Button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.sunday {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.sunday-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.sunday-copy {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.sunday-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.sunday-subtitle {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	.sunday-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.sunday-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		min-height: var(--touch-target-min);
	}

	.sunday-row-copy {
		min-width: 0;
		flex: 1;
	}

	.sunday-name {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.sunday-qty {
		font-weight: 400;
		color: var(--color-text-muted);
	}

	.sunday-reason {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	.sunday-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}
</style>
