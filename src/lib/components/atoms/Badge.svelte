<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'default' | 'warning' | 'location';
		color?: string;
		children: Snippet;
	}

	let { tone = 'default', color, children }: Props = $props();
</script>

<span
	class="badge badge-{tone}"
	style={color ? `background: ${color}22; color: ${color}; border-color: ${color}44` : ''}
>
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.badge-warning {
		background: #fff4e5;
		border-color: #f0d2a8;
		color: #8a5a12;
	}
</style>
