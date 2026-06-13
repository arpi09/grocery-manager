<script lang="ts">

	import Badge from '$lib/components/atoms/Badge.svelte';

	import PredictionExplainSheet from '$lib/components/molecules/PredictionExplainSheet.svelte';

	import type { ExpiresOnSource } from '$lib/domain/auto-expired';

	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';

	import type { ReceiptLocationPrediction } from '$lib/domain/receipt-line';

	import { t } from '$lib/i18n';



	type EstimatedSource =

		| ExpiresOnSource

		| ReceiptLocationPrediction['source']

		| null

		| undefined;



	interface Props {

		source?: EstimatedSource;

		explanation?: PredictionExplanation | null;

		showSettingsLink?: boolean;

	}



	let { source = null, explanation = null, showSettingsLink = false }: Props = $props();



	let expanded = $state(false);

	let sheetOpen = $state(false);



	const sourceHint = $derived.by(() => {

		if (source === 'household_learned' || source === 'household_rule') {

			return t('learning.sourceHousehold');

		}

		if (

			source === 'heuristic' ||

			source === 'ai_inferred' ||

			source === 'external_model'

		) {

			return t('learning.sourceDefault');

		}

		return null;

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

		showSettingsLink ||

			source === 'household_learned' ||

			source === 'household_rule'

	);

</script>



<span class="estimated-badge-wrap">

	{#if sourceHint || hasExplanation}

		<button

			type="button"

			class="estimated-badge-btn"

			aria-expanded={hasExplanation ? sheetOpen : expanded}

			aria-label="{t('learning.estimatedExpiry')}, {explanation?.primary ?? sourceHint ?? ''}"

			onclick={onBadgeClick}

		>

			<Badge tone="default">{t('learning.estimatedExpiry')}</Badge>

		</button>

		{#if !hasExplanation && expanded && sourceHint}

			<span class="source-hint" role="status">{sourceHint}</span>

		{/if}

	{:else}

		<Badge tone="default">{t('learning.estimatedExpiry')}</Badge>

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

