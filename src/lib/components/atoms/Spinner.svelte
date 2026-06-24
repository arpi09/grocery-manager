<script lang="ts">
	type Size = 'sm' | 'md';

	interface Props {
		size?: Size;
		label?: string;
		class?: string;
	}

	let { size = 'md', label = 'Laddar', class: className = '' }: Props = $props();
</script>

<div
	class="spinner spinner-{size} {className}"
	role="status"
	aria-label={label}
	aria-busy="true"
></div>

<style>
	.spinner {
		flex-shrink: 0;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.spinner-sm {
		width: 1rem;
		height: 1rem;
	}

	.spinner-md {
		width: 1.25rem;
		height: 1.25rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			border-top-color: var(--color-primary);
		}
	}
</style>
