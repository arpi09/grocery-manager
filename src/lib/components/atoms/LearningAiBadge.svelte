<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		label?: string;
		variant?: 'gradient' | 'soft';
		testId?: string;
	}

	let { label, variant = 'gradient', testId = 'learning-ai-badge' }: Props = $props();

	const displayLabel = $derived(label ?? t('learning.aiBadge'));
</script>

<span
	class="learning-ai-badge"
	class:learning-ai-badge--gradient={variant === 'gradient'}
	class:learning-ai-badge--soft={variant === 'soft'}
	data-testid={testId}
>
	{displayLabel}
</span>

<style>
	.learning-ai-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.learning-ai-badge--gradient {
		background: var(--color-learning-ai-gradient);
		color: var(--color-on-primary);
		border: 1px solid color-mix(in srgb, var(--color-learning-ai) 35%, var(--color-border));
	}

	.learning-ai-badge--soft {
		background: color-mix(in srgb, var(--color-learning-ai) 14%, var(--color-surface));
		color: var(--color-learning-ai);
		border: 1px solid color-mix(in srgb, var(--color-learning-ai) 28%, var(--color-border));
	}
</style>
