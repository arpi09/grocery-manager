<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import PriceMemoryChip from '$lib/components/molecules/PriceMemoryChip.svelte';
	import type { DedupeWarning } from '$lib/domain/dedupe-autopilot';
	import type { ReplenishmentReasonCode, ReplenishmentSuggestion } from '$lib/domain/replenishment';
	import { trackProductEvent } from '$lib/client/product-events';
	import {
		dismissDedupeWarning,
		filterVisibleDedupeWarnings
	} from '$lib/utils/dedupe-warning-dismiss';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';

	export type ReplenishmentSurface = 'hem' | 'inkop';

	interface Props {
		suggestions: ReplenishmentSuggestion[];
		dedupeByKey?: Record<string, DedupeWarning[]>;
		canEdit?: boolean;
		compact?: boolean;
		surface?: ReplenishmentSurface;
		householdId?: string | null;
		brainFeedbackV1?: boolean;
	}

	let {
		suggestions,
		dedupeByKey = {},
		canEdit = false,
		compact = false,
		surface = 'inkop',
		householdId = null,
		brainFeedbackV1 = false
	}: Props = $props();

	let items = $state<ReplenishmentSuggestion[]>([]);
	let acceptingKey = $state<string | null>(null);
	let dismissingKey = $state<string | null>(null);
	let feedbackKey = $state<string | null>(null);
	let inlineAckByKey = $state<Record<string, string>>({});
	let whyExpandedKey = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);
	let shownTracked = $state(false);
	let shownDedupeKeys = $state(new Set<string>());

	$effect(() => {
		items = suggestions;
	});

	onMount(() => {
		if (suggestions.length > 0 && !shownTracked) {
			shownTracked = true;
			void trackProductEvent('replenishment_suggestion_shown', {
				count: suggestions.length,
				surface
			});
		}
	});

	let dismissedDedupeKeys = $state(new Set<string>());

	function dedupeTrackKey(warning: DedupeWarning): string {
		return `${warning.normalizedKey}:${warning.kind}`;
	}

	function visibleDedupeWarnings(normalizedKey: string): DedupeWarning[] {
		const warnings = dedupeByKey[normalizedKey] ?? [];
		return filterVisibleDedupeWarnings(householdId, warnings).filter(
			(entry) => !dismissedDedupeKeys.has(dedupeTrackKey(entry))
		);
	}

	function dedupeMessage(warning: DedupeWarning): string {
		if (warning.kind === 'overstock') {
			return t('householdBriefing.dedupe.overstock', { name: warning.displayName });
		}
		if (warning.kind === 'recent_purchase') {
			return t('householdBriefing.dedupe.recentPurchase');
		}
		return t('householdBriefing.dedupe.onList');
	}

	function trackDedupeShown(warning: DedupeWarning) {
		const trackKey = `${warning.normalizedKey}:${warning.kind}`;
		if (shownDedupeKeys.has(trackKey)) {
			return;
		}
		shownDedupeKeys = new Set([...shownDedupeKeys, trackKey]);
		void trackProductEvent('duplicate_warning_shown', {
			kind: warning.kind,
			normalizedKey: warning.normalizedKey,
			surface
		});
	}

	$effect(() => {
		if (!householdId) {
			return;
		}
		for (const suggestion of items) {
			for (const warning of filterVisibleDedupeWarnings(
				householdId,
				dedupeByKey[suggestion.normalizedKey] ?? []
			)) {
				trackDedupeShown(warning);
			}
		}
	});

	function dismissDedupeChip(warning: DedupeWarning) {
		if (!householdId) {
			return;
		}
		dismissDedupeWarning(householdId, warning.normalizedKey, warning.kind);
		dismissedDedupeKeys = new Set([...dismissedDedupeKeys, dedupeTrackKey(warning)]);
		void trackProductEvent('duplicate_warning_dismissed', {
			kind: warning.kind,
			normalizedKey: warning.normalizedKey,
			surface
		});
	}

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

	function beliefLine(suggestion: ReplenishmentSuggestion): string {
		const code: ReplenishmentReasonCode = suggestion.reasonCode;
		const name = suggestion.displayName;
		if (code === 'recurring_not_in_pantry') {
			return t('replenishment.feedback.belief.recurringNotInPantry', { name });
		}
		if (code === 'cadence_overdue') {
			return t('replenishment.feedback.belief.cadenceOverdue', { name });
		}
		return t('replenishment.feedback.belief.recurringAndCadence', { name });
	}

	function whyLine(suggestion: ReplenishmentSuggestion): string {
		const code: ReplenishmentReasonCode = suggestion.reasonCode;
		const name = suggestion.displayName;
		if (code === 'recurring_not_in_pantry') {
			return t('replenishment.feedback.why.recentPurchases', {
				name,
				count: suggestion.lineCount
			});
		}
		if (code === 'cadence_overdue' && suggestion.avgIntervalDays) {
			return t('replenishment.feedback.why.cadenceInterval', {
				interval: suggestion.avgIntervalDays
			});
		}
		if (code === 'cadence_overdue') {
			return t('replenishment.feedback.why.daysSinceLast', { days: suggestion.daysSinceLast });
		}
		if (suggestion.avgIntervalDays) {
			return t('replenishment.feedback.why.recurringAndInterval', {
				count: suggestion.lineCount,
				interval: suggestion.avgIntervalDays
			});
		}
		return t('replenishment.feedback.why.recurringAndDays', {
			count: suggestion.lineCount,
			days: suggestion.daysSinceLast
		});
	}

	function feedbackLabels(suggestion: ReplenishmentSuggestion): { positive: string; negative: string } {
		if (suggestion.reasonCode === 'cadence_overdue') {
			return {
				positive: t('replenishment.feedback.positive.helpful'),
				negative: t('replenishment.feedback.negative.notHelpful')
			};
		}
		return {
			positive: t('replenishment.feedback.positive.thatsRight'),
			negative: t('replenishment.feedback.negative.notReally')
		};
	}

	function setInlineAck(key: string, message: string) {
		inlineAckByKey = { ...inlineAckByKey, [key]: message };
		setTimeout(() => {
			const next = { ...inlineAckByKey };
			delete next[key];
			inlineAckByKey = next;
		}, 2000);
	}

	async function sendFeedback(
		suggestion: ReplenishmentSuggestion,
		polarity: 'positive' | 'negative'
	) {
		if (!canEdit || feedbackKey) return;
		feedbackKey = suggestion.normalizedKey;
		errorMessage = null;

		try {
			const response = await fetch('/api/brain/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					predictorId: 'replenishment',
					subjectKey: suggestion.normalizedKey,
					polarity,
					surface,
					reasonCode: suggestion.reasonCode,
					suggestionContext: {
						displayName: suggestion.displayName,
						lineCount: suggestion.lineCount,
						avgIntervalDays: suggestion.avgIntervalDays,
						daysSinceLast: suggestion.daysSinceLast
					}
				})
			});
			const data = (await response.json()) as { ackKey?: string; error?: string };
			if (!response.ok) {
				errorMessage = data.error ?? t('replenishment.acceptFailed');
				return;
			}
			setInlineAck(
				suggestion.normalizedKey,
				t(
					polarity === 'positive'
						? 'replenishment.feedback.ack.positive'
						: 'replenishment.feedback.ack.negative'
				)
			);
			if (polarity === 'positive') {
				void trackProductEvent('brain_feedback_positive', {
					normalizedKey: suggestion.normalizedKey,
					surface,
					reasonCode: suggestion.reasonCode
				});
			} else {
				void trackProductEvent('brain_feedback_negative', {
					normalizedKey: suggestion.normalizedKey,
					surface,
					reasonCode: suggestion.reasonCode
				});
			}
		} catch {
			errorMessage = t('replenishment.acceptFailed');
		} finally {
			feedbackKey = null;
		}
	}

	function toggleWhy(key: string) {
		const next = whyExpandedKey === key ? null : key;
		if (next) {
			void trackProductEvent('brain_explanation_viewed', {
				normalizedKey: key,
				surface
			});
		}
		whyExpandedKey = next;
	}

	function memoryChipLabels(suggestion: ReplenishmentSuggestion): string[] {
		const chips: string[] = [];
		if (suggestion.avgIntervalDays !== null && suggestion.avgIntervalDays > 0) {
			chips.push(t('replenishment.memoryChip.interval', { interval: suggestion.avgIntervalDays }));
		}
		if (suggestion.importCount >= 2) {
			chips.push(t('replenishment.memoryChip.fromReceipts'));
		}
		return chips;
	}

	async function acceptSuggestion(normalizedKey: string) {
		if (!canEdit || acceptingKey) return;
		acceptingKey = normalizedKey;
		errorMessage = null;

		void trackProductEvent('replenishment_suggestion_clicked', { normalizedKey, surface });

		try {
			const response = await fetch('/api/replenishment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ normalizedKey, surface })
			});
			const data = (await response.json()) as { error?: string; name?: string };

			if (!response.ok) {
				errorMessage = data.error ?? t('replenishment.acceptFailed');
				return;
			}

			items = items.filter((entry) => entry.normalizedKey !== normalizedKey);
			if (!brainFeedbackV1) {
				showClientToast(t('replenishment.learningToastAccept'), { variant: 'success' });
			}
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
			if (brainFeedbackV1) {
				setInlineAck(normalizedKey, t('replenishment.feedback.ack.dismiss'));
				void trackProductEvent('brain_feedback_dismissed', { normalizedKey, surface });
			} else {
				showClientToast(t('replenishment.learningToastDismiss'), { variant: 'default' });
			}
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
			<h2>{compact ? t('householdBriefing.replenishmentTitle') : t('replenishment.title')}</h2>
			{#if !compact}
				<p class="intro">{t('replenishment.intro')}</p>
			{/if}
		</header>

		{#if errorMessage}
			<FeedbackBanner tone="error" message={errorMessage} />
		{/if}

		<ul class="suggestions">
			{#each items as suggestion (suggestion.normalizedKey)}
				{@const dedupeWarnings = visibleDedupeWarnings(suggestion.normalizedKey)}
				{@const memoryChips = memoryChipLabels(suggestion)}
				<li>
					<Card class="suggestion-card">
						<div class="copy">
							{#if brainFeedbackV1}
								<span class="belief">{beliefLine(suggestion)}</span>
								<span class="meta">{whyLine(suggestion)}</span>
								<button
									type="button"
									class="why-toggle"
									aria-expanded={whyExpandedKey === suggestion.normalizedKey}
									onclick={() => toggleWhy(suggestion.normalizedKey)}
								>
									{t('replenishment.feedback.whyExpand')}
								</button>
								{#if whyExpandedKey === suggestion.normalizedKey}
									<ul class="why-facts">
										<li>{reasonMessage(suggestion)}</li>
										{#each memoryChips as chip (chip)}
											<li>{chip}</li>
										{/each}
									</ul>
								{/if}
							{:else}
								<span class="name">{suggestion.displayName}</span>
								<span class="meta">{reasonMessage(suggestion)}</span>
							{/if}
							{#if !brainFeedbackV1 && memoryChips.length > 0}
								<div class="memory-chips">
									{#each memoryChips as chip (chip)}
										<Badge tone="default">{chip}</Badge>
									{/each}
								</div>
							{/if}
							{#if brainFeedbackV1}
								<div class="memory-chips">
									{#each memoryChips as chip (chip)}
										<Badge tone="default">{chip}</Badge>
									{/each}
								</div>
							{/if}
							<span class="quantity-hint">{formatQuantity(suggestion)}</span>
							<PriceMemoryChip
								normalizedKey={suggestion.normalizedKey}
								surface="replenishment"
								linkHref="/settings/price-memory"
							/>
							{#if inlineAckByKey[suggestion.normalizedKey]}
								<p class="inline-ack" role="status">
									{inlineAckByKey[suggestion.normalizedKey]}
								</p>
							{/if}
							{#if dedupeWarnings.length > 0}
								<div class="dedupe-chips">
									{#each dedupeWarnings as warning (warning.kind)}
										<span class="dedupe-chip">
											<Badge tone="warning">{dedupeMessage(warning)}</Badge>
											<button
												type="button"
												class="dedupe-dismiss"
												aria-label={t('householdBriefing.dedupe.dismiss')}
												onclick={() => dismissDedupeChip(warning)}
											>
												×
											</button>
										</span>
									{/each}
								</div>
							{/if}
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
								{#if brainFeedbackV1}
									{@const labels = feedbackLabels(suggestion)}
									<div class="feedback-pair">
										<button
											type="button"
											class="feedback-btn"
											disabled={feedbackKey === suggestion.normalizedKey}
											onclick={() => sendFeedback(suggestion, 'positive')}
										>
											{labels.positive}
										</button>
										<button
											type="button"
											class="feedback-btn"
											disabled={feedbackKey === suggestion.normalizedKey}
											onclick={() => sendFeedback(suggestion, 'negative')}
										>
											{labels.negative}
										</button>
									</div>
								{/if}
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

	.belief {
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.35;
	}

	.why-toggle {
		align-self: flex-start;
		border: none;
		background: none;
		padding: 0;
		font-size: 0.8125rem;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.why-facts {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.inline-ack {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.feedback-pair {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.feedback-btn {
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-sm);
		min-height: var(--touch-target-min);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.meta {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.memory-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.quantity-hint {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.dedupe-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}

	.dedupe-chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.dedupe-dismiss {
		border: none;
		background: none;
		padding: 0;
		min-width: 1.5rem;
		min-height: 1.5rem;
		cursor: pointer;
		color: inherit;
		font-size: 1rem;
		line-height: 1;
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
