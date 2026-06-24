<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import type { ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import {
		buildMemoryCadencePresentation,
		isSuggestionOnList,
		visibleMemorySuggestions
	} from '$lib/domain/shopping-v2-presenter';
	import type { ShoppingListItem } from '$lib/domain/shopping-list-item';
	import { t } from '$lib/i18n';

	interface Props {
		suggestions: ReplenishmentSuggestion[];
		items: ShoppingListItem[];
		canEdit: boolean;
		onAccept: (suggestion: ReplenishmentSuggestion) => void | Promise<void>;
		onDismiss: (suggestion: ReplenishmentSuggestion) => void | Promise<void>;
		acceptingKey?: string | null;
		dismissingKey?: string | null;
		/** Hide cadence / buy-again suggestions on inköp during activation focus. */
		deemphasizeCadence?: boolean;
	}

	let {
		suggestions,
		items,
		canEdit,
		onAccept,
		onDismiss,
		acceptingKey = null,
		dismissingKey = null,
		deemphasizeCadence = false
	}: Props = $props();

	const visible = $derived(visibleMemorySuggestions(suggestions, { hideCadence: deemphasizeCadence }));
</script>

<section class="memory-section" aria-labelledby="shopping-v2-memory-heading">
	<h2 id="shopping-v2-memory-heading" class="section-label">{t('shopping.v2.memory.sectionLabel')}</h2>

	{#if visible.length === 0}
		<p class="empty">{t('shopping.v2.memory.empty')}</p>
	{:else}
		<ul class="memory-list" data-testid="shopping-v2-memory-list">
			{#each visible as suggestion (suggestion.normalizedKey)}
				{@const onList = isSuggestionOnList(suggestion, items)}
				{@const cadence = buildMemoryCadencePresentation(suggestion)}
				<li class="memory-row" data-testid="shopping-v2-memory-{suggestion.normalizedKey}">
					<div class="memory-copy">
						<p class="memory-name">{suggestion.displayName}</p>
						<p class="memory-detail">{t(cadence.key, cadence.params)}</p>
					</div>
					<div class="memory-actions">
						{#if onList}
							<span class="on-list" aria-label={t('shopping.v2.memory.onListAria', { name: suggestion.displayName })}>
								{t('shopping.v2.memory.onList')}
							</span>
						{:else if canEdit}
							<Button
								variant="ghost"
								disabled={Boolean(dismissingKey) || Boolean(acceptingKey)}
								loading={dismissingKey === suggestion.normalizedKey}
								onclick={() => onDismiss(suggestion)}
								aria-label={t('shopping.v2.memory.dismissAria', { name: suggestion.displayName })}
							>
								{t('shopping.v2.memory.dismiss')}
							</Button>
							<Button
								variant="secondary"
								disabled={Boolean(dismissingKey) || Boolean(acceptingKey)}
								loading={acceptingKey === suggestion.normalizedKey}
								onclick={() => onAccept(suggestion)}
								aria-label={t('shopping.v2.memory.addAria', { name: suggestion.displayName })}
							>
								{t('shopping.v2.memory.add')}
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.memory-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.section-label {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.empty {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.memory-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.memory-row {
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

	.memory-copy {
		min-width: 0;
		flex: 1;
	}

	.memory-name {
		margin: 0;
		font-weight: 600;
		font-size: 1rem;
	}

	.memory-detail {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.memory-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.on-list {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}
</style>
