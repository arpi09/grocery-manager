<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		messageKey?: 'ai.loadingPantry' | 'ai.loadingWeekly' | 'ai.loadingReceiptExtract' | 'ai.loadingReceiptBbf';
	}

	let { messageKey = 'ai.loadingPantry' }: Props = $props();
</script>

<div class="ai-loading" role="status" aria-live="polite" aria-busy="true">
	<p class="ai-loading-message">{t(messageKey)}</p>
	<div class="skeleton-stack" aria-hidden="true">
		<div class="skeleton-card">
			<div class="skeleton-line skeleton-line--title"></div>
			<div class="skeleton-line skeleton-line--body"></div>
			<div class="skeleton-line skeleton-line--short"></div>
		</div>
		<div class="skeleton-card skeleton-card--dim">
			<div class="skeleton-line skeleton-line--title"></div>
			<div class="skeleton-line skeleton-line--body"></div>
		</div>
	</div>
</div>

<style>
	.ai-loading {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) 0;
	}

	.ai-loading-message {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
	}

	.skeleton-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.skeleton-card {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.skeleton-card--dim {
		opacity: 0.65;
	}

	.skeleton-line {
		height: 0.75rem;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			var(--color-surface-muted) 0%,
			color-mix(in srgb, var(--color-border) 60%, var(--color-surface-muted)) 50%,
			var(--color-surface-muted) 100%
		);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.4s ease-in-out infinite;
	}

	.skeleton-line--title {
		width: 55%;
		height: 1rem;
	}

	.skeleton-line--body {
		width: 90%;
	}

	.skeleton-line--short {
		width: 40%;
	}

	@keyframes skeleton-shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton-line {
			animation: none;
		}
	}
</style>
