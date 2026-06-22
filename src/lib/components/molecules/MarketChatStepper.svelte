<script lang="ts">
	import type { MarketLifecycleStatus } from '$lib/domain/market-lifecycle';
	import { lifecycleStepIndex } from '$lib/domain/market-lifecycle';
	import { t } from '$lib/i18n';

	let { status, compact = false }: { status: MarketLifecycleStatus; compact?: boolean } = $props();

	const steps = $derived([
		t('marketV03.stepTalking'),
		t('marketV03.stepAgreed'),
		t('marketV03.stepHandover'),
		t('marketV03.stepRating')
	]);

	const activeIndex = $derived(lifecycleStepIndex(status));
</script>

<nav class="stepper" class:compact aria-label={t('marketV03.stepperAria')}>
	<ol>
		{#each steps as label, index}
			<li
				class={[
					index < activeIndex ? 'done' : '',
					index === activeIndex ? 'active' : '',
					index > activeIndex ? 'upcoming' : ''
				]
					.filter(Boolean)
					.join(' ')}
			>
				<span class="dot" aria-hidden="true"></span>
				<span class="label">{label}</span>
			</li>
		{/each}
	</ol>
	<div class="track" aria-hidden="true">
		<div class="fill" style={`width: ${(activeIndex / (steps.length - 1)) * 100}%`}></div>
	</div>
</nav>

<style>
	.stepper {
		margin-bottom: var(--space-md);
	}

	.stepper.compact {
		margin-bottom: 0;
	}

	.compact ol {
		margin-bottom: var(--space-2xs);
	}

	.compact .label {
		font-size: 0.625rem;
	}

	.compact .dot {
		width: 0.5rem;
		height: 0.5rem;
	}

	.compact .track {
		height: 0.125rem;
	}

	ol {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-2xs);
		margin: 0 0 var(--space-xs);
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		justify-items: center;
		gap: var(--space-2xs);
		text-align: center;
	}

	.dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 999px;
		border: 2px solid var(--color-border);
		background: var(--color-surface);
	}

	li.done .dot,
	li.active .dot {
		border-color: var(--color-primary);
		background: var(--color-primary);
	}

	.label {
		font-size: 0.7rem;
		line-height: 1.2;
		color: var(--color-text-muted);
	}

	li.active .label {
		color: var(--color-text);
		font-weight: 600;
	}

	.track {
		height: 0.2rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.2s ease;
	}
</style>
