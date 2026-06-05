<script lang="ts">
	import Spinner from '$lib/components/atoms/Spinner.svelte';
	import { t } from '$lib/i18n';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		fullWidth?: boolean;
		loading?: boolean;
		/** Shown next to spinner while `loading` is true. Falls back to button label. */
		loadingLabel?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		fullWidth = false,
		loading = false,
		loadingLabel,
		class: className = '',
		disabled = false,
		children,
		...rest
	}: Props = $props();
</script>

<button
	class="btn btn-{variant} motion-press {fullWidth ? 'btn-full' : ''} {className}"
	disabled={disabled || loading}
	aria-busy={loading || undefined}
	{...rest}
>
	{#if loading}
		<Spinner size="sm" label={loadingLabel ?? t('common.processing')} />
		{#if loadingLabel}
			<span>{loadingLabel}</span>
		{/if}
	{:else}
		{@render children()}
	{/if}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		min-height: 2.75rem;
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		color: var(--color-on-primary);
	}

	.btn-secondary {
		background: var(--color-surface-muted);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-surface-muted) 80%, var(--color-border));
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-text-muted);
	}

	.btn-ghost:hover:not(:disabled) {
		color: var(--color-text);
		background: var(--color-surface-muted);
	}

	.btn-danger {
		background: var(--color-danger);
		color: var(--color-on-primary);
	}

	.btn-full {
		width: 100%;
	}
</style>
