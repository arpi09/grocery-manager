<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import {
		BookOpen,
		Check,
		Home,
		Package,
		Receipt,
		ShoppingCart
	} from '@lucide/svelte';
	import { ACTIVATION_PROGRESS_KEYS, ACTIVATION_SCREEN_COUNT } from '$lib/utils/onboarding-steps';
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

	const stepIcons: Record<ActivationProgressMilestone, Component<IconProps>> = {
		welcome: Home,
		firstScan: Receipt,
		pantryCreated: Package,
		brain: BookOpen,
		shopping: ShoppingCart
	};

	const nodeRefs = $state<Partial<Record<ActivationProgressMilestone, HTMLButtonElement>>>({});

	const activeKey = $derived(preview ?? current);
	const activeStepIndex = $derived(
		activeKey ? ACTIVATION_PROGRESS_KEYS.indexOf(activeKey) : 0
	);
	const activeStepNumber = $derived(activeStepIndex + 1);

	function isActive(key: ActivationProgressMilestone): boolean {
		if (preview) {
			return preview === key;
		}
		return current === key;
	}

	function isConnectorFilled(index: number): boolean {
		if (index <= 0) {
			return false;
		}
		const previousKey = ACTIVATION_PROGRESS_KEYS[index - 1];
		return checklist[previousKey];
	}

	function handleSelect(key: ActivationProgressMilestone) {
		if (!canSelect(key) || !onSelect) {
			return;
		}
		onSelect(key);
	}

	$effect(() => {
		void activeKey;
		const el = activeKey ? nodeRefs[activeKey] : undefined;
		if (!el) {
			return;
		}
		el.scrollIntoView({
			behavior: 'smooth',
			block: 'nearest',
			inline: 'center'
		});
	});
</script>

<div class="progress-path-shell">
	<p class="step-counter" data-testid="activation-progress-counter">
		{t('onboarding.stepOf', {
			current: activeStepNumber,
			total: ACTIVATION_SCREEN_COUNT
		})}
	</p>

	<div class="progress-path-scroll">
		<ol class="progress-path" aria-label={t('onboarding.activation.progressAria')}>
			{#each ACTIVATION_PROGRESS_KEYS as key, index (key)}
				{@const selectable = canSelect(key)}
				{@const done = checklist[key]}
				{@const active = isActive(key)}
				{@const future = !done && !active}
				{@const StepIcon = stepIcons[key]}
				{#if index > 0}
					<li
						class="connector-wrap"
						aria-hidden="true"
						class:connector-filled={isConnectorFilled(index)}
					>
						<div class="connector">
							<div class="connector-fill"></div>
						</div>
					</li>
				{/if}
				<li class="progress-step">
					<button
						type="button"
						class="progress-node"
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
						bind:this={nodeRefs[key]}
						onclick={() => handleSelect(key)}
					>
						<span class="node-marker" aria-hidden="true">
							{#if done}
								<Check size={14} strokeWidth={2.5} class="check-icon" />
							{:else}
								<StepIcon size={14} strokeWidth={2.25} />
							{/if}
						</span>
					</button>

					<span
						class="progress-label"
						class:label-current={active}
						class:label-done={done}
						title={t(progressLabelKeys[key])}
					>
						{t(progressLabelKeys[key])}
					</span>
				</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	.progress-path-shell {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex-shrink: 0;
		position: sticky;
		top: 0;
		z-index: 1;
		padding-bottom: var(--space-xs);
		background: var(--color-surface);
	}

	.step-counter {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.progress-path-scroll {
		overflow-x: auto;
		scroll-snap-type: x proximity;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.progress-path-scroll::-webkit-scrollbar {
		display: none;
	}

	.progress-path {
		display: flex;
		align-items: flex-start;
		gap: 0;
		margin: 0;
		padding: 0 var(--space-xs);
		list-style: none;
		min-width: min(100%, 20rem);
	}

	.progress-step {
		flex: 0 0 3.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		scroll-snap-align: center;
	}

	.connector-wrap {
		flex: 1 1 0.5rem;
		min-width: 0.5rem;
		display: flex;
		align-items: center;
		align-self: center;
		margin-top: -1.125rem;
		list-style: none;
	}

	.connector {
		flex: 1;
		height: 2px;
		background: var(--color-border);
		position: relative;
	}

	.connector-fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 0;
		background: var(--color-primary);
		transition: width 400ms cubic-bezier(0.33, 1, 0.68, 1);
	}

	.connector-filled .connector-fill {
		width: 100%;
	}

	.progress-node {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		flex-shrink: 0;
		margin-inline: auto;
		padding: 0;
		border: 2px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: default;
		transition:
			border-color 200ms ease,
			background-color 200ms ease,
			color 200ms ease,
			transform 200ms ease;
	}

	.progress-node.selectable:not(:disabled) {
		cursor: pointer;
	}

	.progress-node.selectable:not(:disabled):hover {
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
	}

	.progress-node.selectable:not(:disabled):focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.progress-node.done {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, transparent);
		color: var(--color-primary);
	}

	.progress-node.current {
		border-color: var(--color-primary);
		color: var(--color-primary);
		transform: scale(1.06);
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	.progress-node.future:not(.current) {
		opacity: 0.65;
	}

	.node-marker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
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

	.progress-label {
		font-size: 0.65rem;
		font-weight: 500;
		line-height: 1.2;
		color: var(--color-text-muted);
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding-inline: 0.125rem;
	}

	.progress-label.label-done {
		color: var(--color-text);
	}

	.progress-label.label-current {
		color: var(--color-primary);
		font-weight: 600;
	}

	@media (prefers-reduced-motion: reduce) {
		.check-icon {
			animation: none;
		}

		.progress-node {
			transition: none;
			transform: none;
		}

		.connector-fill {
			transition: none;
		}
	}
</style>
