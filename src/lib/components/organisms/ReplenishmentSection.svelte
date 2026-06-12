<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import type { ReplenishmentReasonCode, ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import { trackProductEvent } from '$lib/client/product-events';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	interface Props {
		suggestions: ReplenishmentSuggestion[];
		canEdit?: boolean;
		compact?: boolean;
	}

	let { suggestions, canEdit = false, compact = false }: Props = $props();

	let items = $state<ReplenishmentSuggestion[]>([]);
	let acceptingKey = $state<string | null>(null);
	let dismissingKey = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let shownTracked = $state(false);

	$effect(() => {
		items = suggestions;
	});

	onMount(() => {
		if (suggestions.length > 0 && !shownTracked) {
			shownTracked = true;
			void trackProductEvent('replenishment_suggestion_shown', { count: suggestions.length });
		}
	});

	function formatQuantity(suggestion: ReplenishmentSuggestion): string {
		if (suggestion.unit) {
			return `${suggestion.quantity} ${suggestion.unit}`;
		}
		return suggestion.quantity;
	}

	function reasonMessage(suggestion: ReplenishmentSuggestion): string {
		const code: ReplenishmentReasonCode = suggestion.reasonCode;
		if (code === 'recurring_not_in_pantry') {
			return t('replenishment.reason.recurringNotInPantry', { count: suggestion.lineCount });
		}
		if (code === 'cadence_overdue') {
			return t('replenishment.reason.cadenceOverdue', {
				days: suggestion.daysSinceLast,
				interval: suggestion.avgIntervalDays ?? 0
			});
		}
		return t('replenishment.reason.recurringAndCadence', {
			count: suggestion.lineCount,
			days: suggestion.daysSinceLast,
			interval: suggestion.avgIntervalDays ?? 0
		});
	}

	async function acceptSuggestion(normalizedKey: string) {
		if (!canEdit || acceptingKey) return;
		acceptingKey = normalizedKey;
		errorMessage = null;

		void trackProductEvent('replenishment_suggestion_clicked', { normalizedKey });

		try {
			const response = await fetch('/api/replenishment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			});
			const data = (await response.json()) as { error?: string; name?: string };

			if (!response.ok) {
				errorMessage = data.error ?? t('replenishment.acceptFailed');
				return;
			}

			items = items.filter((entry) => entry.normalizedKey !== normalizedKey);
			showClientToast(t('replenishment.acceptSuccess', { name: data.name ?? '' }), {
				variant: 'success'
			});
		} catch {
			errorMessage = t('replenishment.acceptFailed');
		} finally {
			acceptingKey = null;
		}
	}

	async function dismissSuggestion(normalizedKey: string) {
		if (!canEdit || dismissingKey) return;
		dismissingKey = normalizedKey;
		errorMessage = null;

		try {
			const response = await fetch('/api/replenishment/dismiss', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			});
			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				errorMessage = data.error ?? t('replenishment.dismissFailed');
				return;
			}

			items = items.filter((entry) => entry.normalizedKey !== normalizedKey);
		} catch {
			errorMessage = t('replenishment.dismissFailed');
		} finally {
			dismissingKey = null;
		}
	}
</script>

{#if items.length > 0}
	<section class="replenishment" class:compact aria-label={t('replenishment.ariaLabel')}>
		<header class="header">
			<h2>{t('replenishment.title')}</h2>
			{#if !compact}
				<p class="intro">{t('replenishment.intro')}</p>
			{/if}
		</header>

		{#if errorMessage}
			<FeedbackBanner tone="error" message={errorMessage} />
		{/if}

		<ul class="suggestions">
			{#each items as suggestion (suggestion.normalizedKey)}
				<li>
					<Card class="suggestion-card">
						<div class="copy">
							<span class="name">{suggestion.displayName}</span>
							<span class="meta">{reasonMessage(suggestion)}</span>
							<span class="quantity-hint">{formatQuantity(suggestion)}</span>
						</div>
						{#if canEdit}
							<div class="actions">
								<Button
									type="button"
									loading={acceptingKey === suggestion.normalizedKey}
									loadingLabel={t('common.saving')}
									onclick={() => acceptSuggestion(suggestion.normalizedKey)}
								>
									{t('replenishment.addToList')}
								</Button>
								<button
									type="button"
									class="dismiss"
									disabled={dismissingKey === suggestion.normalizedKey}
									onclick={() => dismissSuggestion(suggestion.normalizedKey)}
								>
									{t('replenishment.dismiss')}
								</button>
							</div>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.replenishment {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.replenishment.compact .intro {
		display: none;
	}

	.header h2 {
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
	}

	.intro {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.suggestions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.suggestion-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-width: 0;
	}

	.name {
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.3;
	}

	.meta {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.quantity-hint {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.dismiss {
		align-self: flex-start;
		min-height: 2.75rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.dismiss:hover:not(:disabled) {
		color: var(--color-text);
	}

	.dismiss:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (min-width: 480px) {
		:global(.suggestion-card) {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}

		.actions {
			flex-shrink: 0;
			align-items: flex-end;
		}
	}
</style>
