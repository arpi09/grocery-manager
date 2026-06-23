<script lang="ts">
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';

	export type ReceiptParseStep = 'extract' | 'classify' | 'predict';

	const STEP_LABEL_KEYS = {
		extract: 'brain.parseStep.extract',
		classify: 'brain.parseStep.classify',
		predict: 'brain.parseStep.predict'
	} as const satisfies Record<ReceiptParseStep, MessageKey>;

	interface Props {
		step: ReceiptParseStep;
	}

	let { step }: Props = $props();

	const steps: ReceiptParseStep[] = ['extract', 'classify', 'predict'];
	const stepIndex = $derived(steps.indexOf(step));
</script>

<ol class="parse-steps" aria-label={t('brain.parseStep.aria')} data-testid="receipt-parse-steps">
	{#each steps as parseStep, index (parseStep)}
		<li class="parse-step" class:active={index <= stepIndex} class:current={parseStep === step}>
			<span class="step-dot" aria-hidden="true"></span>
			<span class="step-label">{t(STEP_LABEL_KEYS[parseStep])}</span>
		</li>
	{/each}
</ol>

<style>
	.parse-steps {
		display: flex;
		gap: var(--space-sm);
		margin: var(--space-md) 0;
		padding: 0;
		list-style: none;
	}

	.parse-step {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.parse-step.active {
		color: var(--color-text);
		font-weight: 600;
	}

	.step-dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		background: var(--color-surface);
	}

	.parse-step.active .step-dot {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 25%, var(--color-surface));
	}

	.parse-step.current .step-dot {
		background: var(--color-primary);
	}

	.step-label {
		text-align: center;
		line-height: 1.2;
	}
</style>
