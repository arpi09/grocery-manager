<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { EngagementStrip } from '$lib/application/gamification.service';
	import { t } from '$lib/i18n';

	interface Props {
		engagement: EngagementStrip;
	}

	let { engagement }: Props = $props();

	function formatOptional(value: number | null | undefined): string {
		return value == null ? '—' : String(value);
	}
</script>

<section class="engagement-strip" aria-labelledby="engagement-strip-heading">
	<Card>
		<div class="strip-header">
			<h2 id="engagement-strip-heading">{t('gamification.stripTitle')}</h2>
			<div class="strip-links">
				<a href="/statistik">{t('gamification.viewStats')}</a>
				<a href="/hem#eat-first">{t('gamification.eatFirstLink')}</a>
			</div>
		</div>

		<div class="metrics">
			<div class="metric">
				<p class="metric-value">{formatOptional(engagement.zeroWasteWeeks)}</p>
				<p class="metric-label">{t('gamification.zeroWasteWeeks')}</p>
			</div>
			<div class="metric">
				<p class="metric-value">{formatOptional(engagement.consumedThisWeek)}</p>
				<p class="metric-label">{t('gamification.consumedThisWeek')}</p>
			</div>
		</div>

		<div class="ritual">
			<div class="ritual-copy">
				<p class="ritual-title">{t('gamification.eatFirstRitual')}</p>
				<p class="ritual-detail">
					{t('gamification.eatFirstProgress', {
						done: engagement.eatFirst.mealsScheduledThisWeek,
						goal: engagement.eatFirst.goal
					})}
				</p>
				{#if engagement.eatFirst.suggestionsThisWeek > 0}
					<p class="ritual-suggestions">
						{t('gamification.eatFirstSuggestions', {
							count: engagement.eatFirst.suggestionsThisWeek
						})}
					</p>
				{/if}
			</div>
			<div
				class="ritual-track"
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={engagement.eatFirst.goal}
				aria-valuenow={Math.min(engagement.eatFirst.mealsScheduledThisWeek, engagement.eatFirst.goal)}
				aria-label={t('gamification.eatFirstRitual')}
			>
				<div
					class="ritual-fill"
					class:complete={engagement.eatFirst.complete}
					style="width: {Math.min(
						100,
						Math.round(
							(engagement.eatFirst.mealsScheduledThisWeek / engagement.eatFirst.goal) * 100
						)
					)}%"
				></div>
			</div>
		</div>

		{#if !engagement.hasConsumptionData}
			<p class="placeholder">{t('gamification.placeholder')}</p>
		{/if}
	</Card>
</section>

<style>
	.engagement-strip :global(.card) {
		padding: var(--space-md);
	}

	.strip-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.strip-header h2 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.strip-links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.metric {
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.metric-value {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.metric-label {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.ritual {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.ritual-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.ritual-detail,
	.ritual-suggestions,
	.placeholder {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.ritual-track {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-border) 70%, transparent);
		overflow: hidden;
	}

	.ritual-fill {
		height: 100%;
		border-radius: inherit;
		background: color-mix(in srgb, var(--color-primary) 75%, var(--color-warning));
		transition: width 0.2s ease;
	}

	.ritual-fill.complete {
		background: var(--color-primary);
	}

	.placeholder {
		margin-top: var(--space-md);
	}
</style>
