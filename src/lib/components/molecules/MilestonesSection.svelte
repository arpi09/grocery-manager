<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { MilestoneState } from '$lib/domain/gamification';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		milestones: MilestoneState[];
	}

	let { milestones }: Props = $props();

	const milestoneLabels: Record<MilestoneState['id'], MessageKey> = {
		pantry10: 'gamification.milestonePantry10',
		firstPlan: 'gamification.milestoneFirstPlan',
		firstReceipt: 'gamification.milestoneFirstReceipt',
		firstConsumption: 'gamification.milestoneFirstConsumption',
		zeroWaste3: 'gamification.milestoneZeroWaste3'
	};
</script>

<Card>
	<h2 class="section-title">{t('gamification.milestonesTitle')}</h2>
	<ul class="milestones" aria-label={t('gamification.milestonesTitle')}>
		{#each milestones as milestone (milestone.id)}
			<li class:achieved={milestone.achieved}>
				<span class="icon" aria-hidden="true">
					<FeatureIcon id={milestone.achieved ? 'check' : 'sparkle'} size={16} />
				</span>
				<span>{t(milestoneLabels[milestone.id])}</span>
			</li>
		{/each}
	</ul>
</Card>

<style>
	.section-title {
		margin: 0 0 var(--space-md);
		font-size: 1rem;
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
	}

	.milestones li.achieved {
		color: var(--color-text);
		border-color: color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.icon {
		display: inline-flex;
		color: var(--color-primary);
		opacity: 0.85;
	}
</style>
