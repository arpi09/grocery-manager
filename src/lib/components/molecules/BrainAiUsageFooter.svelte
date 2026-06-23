<script lang="ts">
	import type { BrainAiUsageCounts } from '$lib/domain/brain-ai-usage';
	import { hasBrainAiUsage } from '$lib/domain/brain-ai-usage';
	import { t } from '$lib/i18n';

	interface Props {
		counts: BrainAiUsageCounts;
	}

	let { counts }: Props = $props();

	const visible = $derived(hasBrainAiUsage(counts));
</script>

{#if visible}
	<p class="brain-ai-footer" role="status" data-testid="brain-ai-usage-footer">
		{t('brain.aiUsage.footer', {
			shelfLife: counts.shelfLifeEstimates,
			location: counts.locationSuggestions,
			low: counts.lowConfidence
		})}
	</p>
{/if}

<style>
	.brain-ai-footer {
		margin: var(--space-md) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
