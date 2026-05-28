<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		fullWidth?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		fullWidth = false,
		class: className = '',
		children,
		...rest
	}: Props = $props();
</script>

<button class="btn btn-{variant} {fullWidth ? 'btn-full' : ''} {className}" {...rest}>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
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
		color: #fff;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	.btn-secondary {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-primary);
	}

	.btn-danger {
		background: var(--color-danger);
		color: #fff;
	}

	.btn-full {
		width: 100%;
	}
</style>
