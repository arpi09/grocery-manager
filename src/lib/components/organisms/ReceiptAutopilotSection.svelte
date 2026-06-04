<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';
	import type { ReceiptPatternSuggestion } from '$lib/domain/purchase-pattern';
	import { t } from '$lib/i18n';

	interface Props {
		suggestions: ReceiptPatternSuggestion[];
		canEdit?: boolean;
		compact?: boolean;
	}

	let { suggestions, canEdit = false, compact = false }: Props = $props();

	let items = $state<ReceiptPatternSuggestion[]>([]);
	let acceptingKey = $state<string | null>(null);
	let dismissingKey = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);

	$effect(() => {
		items = suggestions;
	});

	function formatQuantity(suggestion: ReceiptPatternSuggestion): string {
		if (suggestion.unit) {
			return `${suggestion.quantity} ${suggestion.unit}`;
		}
		return suggestion.quantity;
	}

	async function acceptSuggestion(normalizedKey: string) {
		if (!canEdit || acceptingKey) return;
		acceptingKey = normalizedKey;
		errorMessage = null;

		try {
			const response = await fetch('/api/receipt-autopilot/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			});
			const data = (await response.json()) as { error?: string; name?: string };

			if (!response.ok) {
				errorMessage = data.error ?? t('receiptAutopilot.acceptFailed');
				return;
			}

			items = items.filter((entry) => entry.normalizedKey !== normalizedKey);
			toastMessage = t('receiptAutopilot.acceptSuccess', { name: data.name ?? '' });
		} catch {
			errorMessage = t('receiptAutopilot.acceptFailed');
		} finally {
			acceptingKey = null;
		}
	}

	async function dismissSuggestion(normalizedKey: string) {
		if (!canEdit || dismissingKey) return;
		dismissingKey = normalizedKey;
		errorMessage = null;

		try {
			const response = await fetch('/api/receipt-autopilot/dismiss', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey })
			});
			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				errorMessage = data.error ?? t('receiptAutopilot.dismissFailed');
				return;
			}

			items = items.filter((entry) => entry.normalizedKey !== normalizedKey);
		} catch {
			errorMessage = t('receiptAutopilot.dismissFailed');
		} finally {
			dismissingKey = null;
		}
	}
</script>

<section class="autopilot" class:compact aria-label={t('receiptAutopilot.ariaLabel')}>
	<header class="header">
		<h2>{t('receiptAutopilot.title')}</h2>
		{#if !compact}
			<p class="intro">{t('receiptAutopilot.intro')}</p>
		{/if}
	</header>

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if items.length === 0}
		<EmptyState
			iconId="receipt"
			title={t('receiptAutopilot.emptyTitle')}
			description={t('receiptAutopilot.emptyDescription')}
			actionLabel={t('receiptAutopilot.emptyAction')}
			actionHref="/scan?mode=receipt&from=/hem"
		/>
	{:else}
		<ul class="suggestions">
			{#each items as suggestion (suggestion.normalizedKey)}
				<li>
					<Card class="suggestion-card">
						<div class="copy">
							<span class="name">{suggestion.displayName}</span>
							<span class="meta">
								{t('receiptAutopilot.recurringMeta', {
									count: suggestion.importCount,
									quantity: formatQuantity(suggestion)
								})}
							</span>
						</div>
						{#if canEdit}
							<div class="actions">
								<Button
									type="button"
									loading={acceptingKey === suggestion.normalizedKey}
									loadingLabel={t('common.saving')}
									onclick={() => acceptSuggestion(suggestion.normalizedKey)}
								>
									{t('receiptAutopilot.addToPantry')}
								</Button>
								<button
									type="button"
									class="dismiss"
									disabled={dismissingKey === suggestion.normalizedKey}
									onclick={() => dismissSuggestion(suggestion.normalizedKey)}
								>
									{t('receiptAutopilot.dismiss')}
								</button>
							</div>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if toastMessage}
	<Toast
		message={toastMessage}
		visible={true}
		variant="success"
		durationMs={TOAST_DEFAULT_DURATION_MS}
		onDismiss={() => (toastMessage = null)}
	/>
{/if}

<style>
	.autopilot {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.autopilot.compact .intro {
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
