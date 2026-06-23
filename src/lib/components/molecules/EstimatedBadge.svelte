<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import PredictionExplainSheet from '$lib/components/molecules/PredictionExplainSheet.svelte';
	import type { ExpiresOnSource } from '$lib/domain/auto-expired';
	import { presentExpiryBadge } from '$lib/domain/learning/expiry-badge-presenter';
	import type { PredictionSource } from '$lib/domain/learning/predictor-types';
	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
	import type { ReceiptLocationPrediction } from '$lib/domain/receipt-line';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';

	type EstimatedSource =
		| ExpiresOnSource
		| PredictionSource
		| ReceiptLocationPrediction['source']
		| null
		| undefined;

	interface Props {
		source?: EstimatedSource;
		explanation?: PredictionExplanation | null;
		showSettingsLink?: boolean;
		label?: string;
		interactive?: boolean;
		lowConfidence?: boolean;
		lineConfidence?: number | null;
	}

	let {
		source = null,
		explanation = null,
		showSettingsLink = false,
		label,
		interactive = true,
		lowConfidence = false,
		lineConfidence = null
	}: Props = $props();

	const presentation = $derived(
		presentExpiryBadge({ source, confidence: lineConfidence, lowConfidence })
	);

	const badgeLabel = $derived(label ?? t(presentation.labelKey as MessageKey));

	let expanded = $state(false);
	let sheetOpen = $state(false);

	const sourceHint = $derived.by(() => {
		if (!presentation.sourceHintKey) return null;
		return t(presentation.sourceHintKey as MessageKey);
	});

	const hasExplanation = $derived(Boolean(explanation?.primary?.trim()));

	function onBadgeClick() {
		if (hasExplanation) {
			sheetOpen = true;
			return;
		}
		if (!sourceHint) return;
		expanded = !expanded;
	}

	const showSettingsInSheet = $derived(
		showSettingsLink || source === 'household_learned' || source === 'household_rule'
	);
</script>

<span class="estimated-badge-wrap">
	{#if !interactive}
		<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
	{:else if sourceHint || hasExplanation}
		<button
			type="button"
			class="estimated-badge-btn"
			aria-expanded={hasExplanation ? sheetOpen : expanded}
			aria-label="{badgeLabel}, {explanation?.primary ?? sourceHint ?? ''}"
			onclick={onBadgeClick}
		>
			<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
		</button>
		{#if !hasExplanation && expanded && sourceHint}
			<span class="source-hint" role="status">{sourceHint}</span>
		{/if}
	{:else}
		<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
	{/if}
</span>

{#if hasExplanation && explanation}
	<PredictionExplainSheet
		open={sheetOpen}
		{explanation}
		showSettingsLink={showSettingsInSheet}
		onClose={() => {
			sheetOpen = false;
		}}
	/>
{/if}

<style>
	.estimated-badge-wrap {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.estimated-badge-btn {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		min-width: 2.75rem;
		border: none;
		background: none;
		padding: 0.25rem 0;
		cursor: pointer;
		font: inherit;
	}

	.source-hint {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		line-height: 1.3;
		max-width: 12rem;
	}
</style>
