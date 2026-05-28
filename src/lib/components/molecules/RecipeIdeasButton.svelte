<script lang="ts">
	interface Props {
		onclick?: () => void;
		compact?: boolean;
	}

	let { onclick, compact = false }: Props = $props();
</script>

<button
	type="button"
	class="recipe-ideas-btn"
	class:compact
	{onclick}
	aria-label="Öppna receptidéer – generera måltidsförslag från ditt lager"
>
	<span class="border-glow" aria-hidden="true"></span>
	<span class="inner">
		<svg
			class="icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M9.5 2.5 11 7l4.5 1-3.5 3 1 4.5L7 13l-4.5 1 1-4.5L3 6l4.5-1L9.5 2.5Z" />
			<path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
		</svg>
		<span class="label">Receptidéer</span>
		<span class="badge">Ny</span>
	</span>
</button>

<style>
	.recipe-ideas-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		padding: 1.5px;
		border: 0;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 70%, var(--color-accent)),
			color-mix(in srgb, var(--color-accent) 80%, var(--color-primary)),
			color-mix(in srgb, var(--color-primary) 60%, #fff)
		);
		background-size: 200% 200%;
		cursor: pointer;
		font: inherit;
		animation: gradient-shift 4s ease infinite;
		flex-shrink: 0;
	}

	.border-glow {
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		background: linear-gradient(
			120deg,
			transparent 30%,
			color-mix(in srgb, var(--color-accent) 55%, transparent) 50%,
			transparent 70%
		);
		background-size: 220% 100%;
		opacity: 0.55;
		animation: shimmer 2.8s ease-in-out infinite;
		pointer-events: none;
	}

	.inner {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		padding: 0.35rem 0.85rem 0.35rem 0.65rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-surface) 92%, var(--color-bg));
		color: var(--color-primary);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		white-space: nowrap;
		box-shadow: var(--shadow-sm);
	}

	:global(html[data-theme='dark']) .inner {
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-bg));
	}

	.icon {
		flex-shrink: 0;
		color: color-mix(in srgb, var(--color-primary) 85%, var(--color-accent));
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.4rem;
		border-radius: 999px;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-accent) 90%, var(--color-primary)),
			var(--color-primary)
		);
		color: #fff;
		font-size: 0.625rem;
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		animation: badge-pulse 2.4s ease-in-out infinite;
	}

	.compact .inner {
		min-height: 2rem;
		padding: 0.3rem 0.65rem 0.3rem 0.55rem;
		font-size: 0.75rem;
	}

	.compact .icon {
		width: 16px;
		height: 16px;
	}

	.recipe-ideas-btn:hover .inner {
		background: color-mix(in srgb, var(--color-surface-muted) 70%, var(--color-surface));
	}

	.recipe-ideas-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 3px;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	@keyframes shimmer {
		0%,
		100% {
			background-position: 200% 0;
			opacity: 0.35;
		}
		50% {
			background-position: -20% 0;
			opacity: 0.7;
		}
	}

	@keyframes badge-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.recipe-ideas-btn,
		.border-glow,
		.badge {
			animation: none;
		}
	}
</style>
