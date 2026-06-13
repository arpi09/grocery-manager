<script lang="ts">
	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
	import { renderExplanationContent } from '$lib/domain/learning/prediction-explain';
	import { t } from '$lib/i18n';

	interface Props {
		explanation: PredictionExplanation;
	}

	let { explanation }: Props = $props();

	const content = $derived(renderExplanationContent(explanation));
</script>

<div class="explain-block">
	<section class="block">
		<h3>{t('memory.detail.whatHeading')}</h3>
		<p>{content.primary}</p>
	</section>
	{#if content.facts.length > 0}
		<section class="block">
			<h3>{t('memory.detail.whyHeading')}</h3>
			<ul>
				{#each content.facts as fact (fact)}
					<li>{fact}</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.explain-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.block h3 {
		margin: 0 0 var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.block p {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.45;
	}

	.block ul {
		margin: 0;
		padding-left: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.925rem;
		line-height: 1.45;
	}
</style>
