<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary';

	interface Props {
		href: string;
		variant?: Variant;
		fullWidth?: boolean;
		children: Snippet;
	}

	let { href, variant = 'primary', fullWidth = false, children }: Props = $props();
</script>

<a class="btn-link btn-{variant} {fullWidth ? 'btn-full' : ''}" {href}>
	{@render children()}
</a>

<style>
	.btn-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-sm);
		font-weight: 600;
		text-decoration: none;
		transition:
			background 0.15s,
			transform 0.1s;
	}

	.btn-primary {
		background: var(--color-primary);
		color: #fff;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-secondary {
		background: var(--color-surface-muted);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: color-mix(in srgb, var(--color-surface-muted) 80%, var(--color-border));
	}

	.btn-full {
		width: 100%;
	}
</style>
