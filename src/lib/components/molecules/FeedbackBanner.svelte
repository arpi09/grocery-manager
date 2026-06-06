<script lang="ts">
	type Tone = 'success' | 'warning' | 'error' | 'info';

	interface Props {
		tone?: Tone;
		message: string;
		class?: string;
	}

	let { tone = 'info', message, class: className = '' }: Props = $props();

	const role = $derived(tone === 'error' ? 'alert' : 'status');
	const live = $derived(tone === 'error' ? 'assertive' : 'polite');
</script>

<p class="feedback feedback-{tone} {className}" {role} aria-live={live}>
	{message}
</p>

<style>
	.feedback {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		margin: 0 0 var(--space-md);
		font-size: 0.875rem;
		line-height: 1.45;
		font-weight: 500;
	}

	.feedback-success {
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
	}

	.feedback-warning {
		background: color-mix(in srgb, var(--color-accent) 22%, var(--color-surface));
		color: color-mix(in srgb, var(--color-text) 75%, #8a5a12);
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
	}

	.feedback-error {
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: color-mix(in srgb, var(--color-danger) 65%, #3d1515);
		border: 1px solid color-mix(in srgb, var(--color-danger) 25%, var(--color-border));
	}

	.feedback-info {
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
	}
</style>
