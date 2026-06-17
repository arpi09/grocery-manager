<script lang="ts">
	import { ACTIVATION_PROGRESS_KEYS } from '$lib/utils/onboarding-steps';
	import type { ActivationProgressMilestone } from '$lib/utils/activation-onboarding-state';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		checklist: Record<ActivationProgressMilestone, boolean>;
		current: ActivationProgressMilestone | null;
	}

	let { checklist, current }: Props = $props();

	const progressLabelKeys: Record<ActivationProgressMilestone, MessageKey> = {
		welcome: 'onboarding.activation.progress.welcome',
		firstScan: 'onboarding.activation.progress.firstScan',
		pantryCreated: 'onboarding.activation.progress.pantryCreated',
		brain: 'onboarding.activation.progress.brain',
		shopping: 'onboarding.activation.progress.shopping'
	};
</script>

<ol class="progress-checklist" aria-label={t('onboarding.activation.progressAria')}>
	{#each ACTIVATION_PROGRESS_KEYS as key (key)}
		<li
			class="progress-item"
			class:done={checklist[key]}
			class:current={current === key}
			data-testid={`activation-progress-${key}`}
		>
			<span class="progress-marker" aria-hidden="true">
				{#if checklist[key]}
					<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
						<path
							d="M3 8.5 L6.5 12 L13 4"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			</span>
			<span class="progress-label">{t(progressLabelKeys[key])}</span>
		</li>
	{/each}
</ol>

<style>
	.progress-checklist {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.progress-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-height: var(--touch-target-min);
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.progress-item.done {
		color: var(--color-text);
	}

	.progress-item.current {
		color: var(--color-primary);
		font-weight: 600;
	}

	.progress-marker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		border: 2px solid var(--color-border);
		flex-shrink: 0;
	}

	.progress-item.done .progress-marker {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.progress-item.current .progress-marker {
		border-color: var(--color-primary);
	}
</style>
