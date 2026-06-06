<script lang="ts">
	import { browser } from '$app/environment';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import GamificationIllustration from '$lib/components/atoms/GamificationIllustration.svelte';
	import type { MilestoneState } from '$lib/domain/gamification';
	import { getMilestoneRegistryEntry } from '$lib/domain/gamification.registry';
	import { t } from '$lib/i18n';
	import {
		markMilestoneUnlockSeen,
		shouldAnimateMilestoneUnlock
	} from '$lib/utils/gamification-celebrations';

	interface Props {
		milestones: MilestoneState[];
		householdId?: string | null;
	}

	let { milestones, householdId = null }: Props = $props();

	const achievedCount = $derived(milestones.filter((m) => m.achieved).length);

	function shouldUnlockAnimate(milestone: MilestoneState): boolean {
		if (!browser || !householdId || !milestone.achieved) {
			return false;
		}
		return shouldAnimateMilestoneUnlock(milestone.id, householdId);
	}

	function handleMilestoneUnlockSeen(milestone: MilestoneState) {
		if (!householdId || !milestone.achieved) {
			return;
		}
		markMilestoneUnlockSeen(milestone.id, householdId);
	}
</script>

<Card class="milestones-card motion-fade-in">
	<div class="section-head">
		<h2 class="section-title">{t('gamification.milestonesTitle')}</h2>
		<span
			class="progress-pill"
			aria-label={t('gamification.milestonesProgress', {
				done: achievedCount,
				total: milestones.length
			})}
		>
			{achievedCount}/{milestones.length}
		</span>
	</div>
	<ul class="milestones motion-stagger-children" aria-label={t('gamification.milestonesTitle')}>
		{#each milestones as milestone (milestone.id)}
			{@const entry = getMilestoneRegistryEntry(milestone.id)}
			{@const unlockAnimate = shouldUnlockAnimate(milestone)}
			<li
				class:achieved={milestone.achieved}
				class:unlock-animate={unlockAnimate}
				onanimationend={() => handleMilestoneUnlockSeen(milestone)}
			>
				<span class="icon" aria-hidden="true">
					{#if milestone.achieved && unlockAnimate}
						<GamificationIllustration variant={entry?.illustration ?? 'milestone'} size={28} />
					{:else}
						<FeatureIcon id={milestone.achieved ? 'check' : (entry?.icon ?? 'sparkle')} size={16} />
					{/if}
				</span>
				<span class="label">{t(entry?.i18nKey ?? 'gamification.milestonesTitle')}</span>
			</li>
		{/each}
	</ul>
</Card>

<style>
	:global(.milestones-card) {
		overflow: hidden;
	}

	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.section-title {
		margin: 0;
		font-size: 1rem;
	}

	.progress-pill {
		flex-shrink: 0;
		padding: 0.2rem 0.55rem;
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
		border-radius: 999px;
	}

	.milestones {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.milestones li {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		font-size: 0.875rem;
		color: var(--color-text-muted);
		background: var(--color-surface-muted);
		transition:
			border-color 0.2s ease,
			background 0.2s ease,
			transform 0.2s ease;
	}

	.milestones li.achieved {
		color: var(--color-text);
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.milestones li.unlock-animate {
		animation: milestone-achieved 0.5s var(--motion-ease-out, ease-out);
	}

	.label {
		flex: 1;
		min-width: 0;
	}

	.icon {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-primary);
		opacity: 0.85;
	}

	.milestones li.unlock-animate .icon {
		animation: milestone-check-pop 0.45s var(--motion-ease-out, ease-out);
	}

	@keyframes milestone-achieved {
		0% {
			transform: scale(0.98);
		}
		45% {
			transform: scale(1.01);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes milestone-check-pop {
		0% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		70% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.milestones li.unlock-animate,
		.milestones li.unlock-animate .icon {
			animation: none;
		}
	}
</style>
