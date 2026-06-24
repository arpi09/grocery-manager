<script lang="ts">
	import type { MarketingStep } from '$lib/marketing/content';

	interface Props {
		step: MarketingStep;
	}

	let { step }: Props = $props();
</script>

<article class="step-card">
	<span class="step-num" aria-hidden="true">{step.step}</span>
	<div class="body">
		<h3 class="title">{step.title}</h3>
		<p class="description">{step.description}</p>
	</div>
</article>

<style>
	.step-card {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.step-num {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		font-size: var(--font-size-body);
	}

	.title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.description {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}
</style>
