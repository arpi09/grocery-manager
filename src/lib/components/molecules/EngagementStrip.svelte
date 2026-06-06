<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import AnimatedNumber from '$lib/components/atoms/AnimatedNumber.svelte';
	import ProgressRing from '$lib/components/atoms/ProgressRing.svelte';
	import type { EngagementStrip } from '$lib/application/gamification.service';
	import { ZERO_WASTE_STREAK_CELEBRATION } from '$lib/domain/gamification';
	import { getMilestoneRegistryEntry } from '$lib/domain/gamification.registry';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		engagement: EngagementStrip;
	}

	let { engagement }: Props = $props();

	const zeroWasteWeeks = $derived(engagement.zeroWasteWeeks ?? 0);
	const streakActive = $derived(
		engagement.zeroWasteWeeks != null &&
			engagement.zeroWasteWeeks >= ZERO_WASTE_STREAK_CELEBRATION
	);
	const streakRingRatio = $derived(
		engagement.zeroWasteWeeks == null
			? 0
			: Math.min(1, engagement.zeroWasteWeeks / ZERO_WASTE_STREAK_CELEBRATION)
	);
	const ritualRatio = $derived(
		Math.min(1, engagement.eatFirst.mealsScheduledThisWeek / engagement.eatFirst.goal)
	);
	const nextMilestone = $derived(engagement.nextMilestone);
	const nextMilestoneEntry = $derived(
		nextMilestone ? getMilestoneRegistryEntry(nextMilestone.id) : null
	);
	const nextMilestoneRatio = $derived(
		nextMilestone && nextMilestone.target > 0
			? Math.min(1, nextMilestone.current / nextMilestone.target)
			: 0
	);
	const showStreakHint = $derived(
		nextMilestone?.id === 'zeroWaste3' &&
			(engagement.zeroWasteWeeks ?? 0) > 0 &&
			(engagement.zeroWasteWeeks ?? 0) < ZERO_WASTE_STREAK_CELEBRATION
	);

	const nextMilestoneLabelKey = $derived(
		nextMilestoneEntry?.i18nKey ?? ('gamification.nextMilestoneTitle' as MessageKey)
	);
</script>

<section class="engagement-strip motion-fade-in" aria-labelledby="engagement-strip-heading">
	<Card>
		<div class="strip-header">
			<h2 id="engagement-strip-heading">{t('gamification.stripTitle')}</h2>
			<div class="strip-links">
				<a href="/statistik">{t('gamification.viewStats')}</a>
				<a href="/planer/vecka">{t('gamification.eatFirstLink')}</a>
			</div>
		</div>

		<div class="metrics">
			<div class="metric metric-streak" class:streak-active={streakActive}>
				<ProgressRing
					ratio={streakRingRatio}
					size={64}
					strokeWidth={6}
					label={engagement.zeroWasteWeeks == null ? '—' : String(zeroWasteWeeks)}
					active={streakActive}
					ariaLabel={t('gamification.zeroWasteWeeks')}
				/>
				<div class="metric-copy">
					<p class="metric-label">{t('gamification.zeroWasteWeeks')}</p>
					{#if streakActive}
						<span class="streak-badge">{t('gamification.streakBadge')}</span>
					{:else if engagement.zeroWasteWeeks != null && engagement.zeroWasteWeeks > 0}
						<span class="streak-count">
							{t('gamification.nextMilestoneProgress', {
								current: engagement.zeroWasteWeeks,
								target: ZERO_WASTE_STREAK_CELEBRATION
							})}
						</span>
					{/if}
				</div>
			</div>

			<div class="metric">
				<div class="metric-number-wrap" aria-hidden="true">
					<p class="metric-value">
						<AnimatedNumber value={engagement.consumedThisWeek} />
					</p>
				</div>
				<p class="metric-label">{t('gamification.consumedThisWeek')}</p>
			</div>
		</div>

		{#if nextMilestone}
			<div class="next-milestone">
				<ProgressRing
					ratio={nextMilestoneRatio}
					size={44}
					strokeWidth={5}
					label="{nextMilestone.current}/{nextMilestone.target}"
					ariaLabel={t(nextMilestoneLabelKey)}
				/>
				<div class="next-copy">
					<p class="next-title">{t('gamification.nextMilestoneTitle')}</p>
					<p class="next-label">{t(nextMilestoneLabelKey)}</p>
					{#if nextMilestone.target > 1}
						<p class="next-progress">
							{t('gamification.nextMilestoneProgress', {
								current: nextMilestone.current,
								target: nextMilestone.target
							})}
						</p>
					{/if}
					{#if showStreakHint}
						<p class="next-hint">{t('gamification.nextMilestoneStreakHint')}</p>
					{/if}
				</div>
			</div>
		{/if}

		<div class="ritual" class:ritual-complete={engagement.eatFirst.complete}>
			<ProgressRing
				ratio={ritualRatio}
				size={48}
				strokeWidth={5}
				label="{engagement.eatFirst.mealsScheduledThisWeek}/{engagement.eatFirst.goal}"
				ariaLabel={t('gamification.eatFirstRitual')}
			/>
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
		</div>

		{#if !engagement.hasConsumptionData}
			<p class="placeholder">{t('gamification.placeholder')}</p>
		{/if}
	</Card>
</section>

<style>
	.engagement-strip :global(.card) {
		padding: var(--space-md);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)),
			var(--color-surface)
		);
		border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
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
		grid-template-columns: 1.2fr 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
		align-items: center;
	}

	.metric {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		min-height: 4.5rem;
	}

	.metric-streak {
		border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
	}

	.metric-streak.streak-active {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
		animation: streak-ring-pulse 2.4s ease-in-out infinite;
	}

	.metric-copy {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.metric-number-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
	}

	.metric-value {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.metric-label {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.streak-badge {
		display: inline-flex;
		align-self: flex-start;
		padding: 0.12rem 0.45rem;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 14%, transparent);
		border-radius: 999px;
		animation: streak-badge-glow 2.4s ease-in-out infinite;
	}

	.streak-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.next-milestone {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px dashed color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
	}

	.next-title {
		margin: 0;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.next-label {
		margin: 0.1rem 0 0;
		font-size: 0.875rem;
		font-weight: 700;
	}

	.next-progress,
	.next-hint {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.next-hint {
		color: var(--color-primary);
		font-weight: 600;
	}

	.next-copy {
		flex: 1;
		min-width: 0;
	}

	.ritual {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		transition:
			border-color 0.25s ease,
			box-shadow 0.25s ease;
	}

	.ritual-complete {
		border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 8%, transparent);
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

	.ritual-copy {
		flex: 1;
		min-width: 0;
	}

	.placeholder {
		margin-top: var(--space-md);
	}

	@keyframes streak-badge-glow {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
		50% {
			box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 12%, transparent);
		}
	}

	@keyframes streak-ring-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
		50% {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.streak-badge,
		.metric-streak.streak-active {
			animation: none;
		}
	}
</style>
