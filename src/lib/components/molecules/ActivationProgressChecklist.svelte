<script lang="ts">
	import { ACTIVATION_PROGRESS_KEYS } from '$lib/utils/onboarding-steps';
	import type { ActivationProgressMilestone } from '$lib/utils/activation-onboarding-state';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		checklist: Record<ActivationProgressMilestone, boolean>;
		current: ActivationProgressMilestone | null;
		preview?: ActivationProgressMilestone | null;
		onSelect?: (key: ActivationProgressMilestone) => void;
		canSelect?: (key: ActivationProgressMilestone) => boolean;
	}

	let {
		checklist,
		current,
		preview = null,
		onSelect,
		canSelect = () => false
	}: Props = $props();

	const progressLabelKeys: Record<ActivationProgressMilestone, MessageKey> = {
		welcome: 'onboarding.activation.progress.welcome',
		firstScan: 'onboarding.activation.progress.firstScan',
		pantryCreated: 'onboarding.activation.progress.pantryCreated',
		brain: 'onboarding.activation.progress.brain',
		shopping: 'onboarding.activation.progress.shopping'
	};

	function isActive(key: ActivationProgressMilestone): boolean {
		if (preview) {
			return preview === key;
		}
		return current === key;
	}

	function handleSelect(key: ActivationProgressMilestone) {
		if (!canSelect(key) || !onSelect) {
			return;
		}
		onSelect(key);
	}
</script>

<ol class="progress-checklist" aria-label={t('onboarding.activation.progressAria')}>
	{#each ACTIVATION_PROGRESS_KEYS as key, index (key)}
		{@const selectable = canSelect(key)}
		{@const done = checklist[key]}
		{@const active = isActive(key)}
		{@const future = !done && !active}
		<li class="progress-item-wrap">
			<button
				type="button"
				class="progress-item"
				class:done
				class:current={active}
				class:future
				class:selectable={selectable}
				disabled={!selectable}
				aria-disabled={!selectable}
				aria-current={active ? 'step' : undefined}
				aria-label={future
					? `${t(progressLabelKeys[key])} — ${t('onboarding.activation.progressStepDisabled')}`
					: t(progressLabelKeys[key])}
				data-testid={`activation-progress-${key}`}
				onclick={() => handleSelect(key)}
			>
				<span class="progress-marker" aria-hidden="true">
					{#if done}
						<svg class="check-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
							<path
								d="M3 8.5 L6.5 12 L13 4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else}
						<span class="step-number">{index + 1}</span>
					{/if}
				</span>
				<span class="progress-label" class:label-hidden={future && !active}>
					{t(progressLabelKeys[key])}
				</span>
			</button>
		</li>
	{/each}
</ol>

<style>
	.progress-checklist {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin: 0;
		padding: 0;
		list-style: none;
		flex-shrink: 0;
	}

	@media (max-width: 767px) {
		.progress-checklist {
			gap: 0.125rem;
		}
	}

	.progress-item-wrap {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.progress-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		min-height: var(--touch-target-min);
		padding: 0.125rem 0;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-weight: 500;
		text-align: left;
		cursor: default;
		border-radius: var(--radius-sm);
		transition: color 180ms ease, background-color 180ms ease;
	}

	@media (max-width: 767px) {
		.progress-item {
			min-height: 2rem;
			font-size: 0.75rem;
			gap: var(--space-xs);
		}
	}

	.progress-item.selectable:not(:disabled) {
		cursor: pointer;
	}

	.progress-item.selectable:not(:disabled):hover {
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
	}

	.progress-item.selectable:not(:disabled):active {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.progress-item.selectable:not(:disabled):focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.progress-item.done {
		color: var(--color-text);
	}

	.progress-item.current {
		color: var(--color-primary);
		font-weight: 600;
	}

	.progress-item.future:not(.current) {
		opacity: 0.55;
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
		transition:
			border-color 200ms ease,
			background-color 200ms ease,
			box-shadow 200ms ease;
	}

	.step-number {
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-text-muted);
	}

	.check-icon {
		animation: check-pop 200ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes check-pop {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.progress-item.done .progress-marker {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.progress-item.current .progress-marker {
		border-color: var(--color-primary);
		animation: current-pulse 2s ease-in-out infinite;
	}

	@keyframes current-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
		50% {
			box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent);
		}
	}

	.progress-label.label-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.check-icon {
			animation: none;
		}

		.progress-item.current .progress-marker {
			animation: none;
		}

		.progress-item {
			transition: none;
		}

		.progress-marker {
			transition: none;
		}
	}
</style>
