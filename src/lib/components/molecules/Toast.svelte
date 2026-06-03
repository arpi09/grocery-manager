<script lang="ts">
	import { portal } from '$lib/actions/portal';
	import { t } from '$lib/i18n';

	export type ToastVariant = 'default' | 'success' | 'error' | 'info';
	export type ToastSize = 'compact' | 'action';

	interface Props {
		message: string;
		visible?: boolean;
		durationMs?: number;
		variant?: ToastVariant;
		size?: ToastSize;
		/** Subtle accent for milestone / gamification toasts */
		celebrate?: boolean;
		/** Tap anywhere on the toast to dismiss */
		tapToDismiss?: boolean;
		onDismiss?: () => void;
	}

	let {
		message,
		visible = true,
		durationMs = 4500,
		variant = 'default',
		size = 'compact',
		celebrate = false,
		tapToDismiss = true,
		onDismiss
	}: Props = $props();

	let show = $state(visible);

	$effect(() => {
		show = visible;
	});

	$effect(() => {
		if (!visible || !message) {
			return;
		}

		const timer = window.setTimeout(() => {
			show = false;
			onDismiss?.();
		}, durationMs);

		return () => window.clearTimeout(timer);
	});

	function dismiss() {
		show = false;
		onDismiss?.();
	}

	function handleToastClick() {
		if (!tapToDismiss || !onDismiss) {
			return;
		}
		dismiss();
	}

</script>

{#if show && message}
	<div
		use:portal={'body'}
		class="toast motion-slide-up"
		class:toast-celebrate={celebrate}
		class:toast-success={variant === 'success'}
		class:toast-error={variant === 'error'}
		class:toast-info={variant === 'info'}
		class:toast-action={size === 'action'}
		class:toast-tappable={tapToDismiss && !!onDismiss}
		role="status"
		aria-live="polite"
		onclick={handleToastClick}
	>
		{#if variant === 'success'}
			<span class="toast-icon" aria-hidden="true">✓</span>
		{:else if variant === 'error'}
			<span class="toast-icon" aria-hidden="true">!</span>
		{:else if variant === 'info'}
			<span class="toast-icon" aria-hidden="true">i</span>
		{/if}
		<p class="toast-message">{message}</p>
		{#if onDismiss}
			<button
				type="button"
				class="dismiss"
				onclick={(event) => {
					event.stopPropagation();
					dismiss();
				}}
				aria-label={t('common.close')}
			>
				×
			</button>
		{/if}
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		max-width: min(420px, calc(100vw - 2 * var(--space-md)));
		padding: var(--space-sm) var(--space-md);
		background: var(--color-text);
		color: #fff;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		border: 1px solid transparent;
	}

	.toast-action {
		width: min(28rem, calc(100vw - 2 * var(--space-md)));
		max-width: min(28rem, calc(100vw - 2 * var(--space-md)));
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 28px rgba(31, 42, 36, 0.18);
		cursor: pointer;
	}

	.toast-tappable {
		cursor: pointer;
	}

	.toast-success {
		background: var(--color-primary);
		color: #fff;
		border-color: color-mix(in srgb, var(--color-primary) 80%, #000);
	}

	.toast-error {
		background: var(--color-danger);
		color: #fff;
		border-color: color-mix(in srgb, var(--color-danger) 75%, #000);
	}

	.toast-info {
		background: var(--color-surface);
		color: var(--color-text);
		border-color: var(--color-border);
		box-shadow: var(--shadow-md);
	}

	.toast-info .toast-icon {
		background: var(--color-surface-muted);
		color: var(--color-primary);
	}

	.toast-celebrate {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 88%, #1a2420),
			var(--color-text)
		);
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
	}

	.toast-icon {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.2);
		font-size: 1rem;
		font-weight: 800;
		line-height: 1;
	}

	.toast-message {
		margin: 0;
		flex: 1;
		min-width: 0;
		font-size: 0.9rem;
		line-height: 1.4;
		font-weight: 600;
	}

	.toast-action .toast-message {
		font-size: 1rem;
		line-height: 1.45;
	}

	.dismiss {
		border: none;
		background: transparent;
		color: inherit;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.2rem;
		flex-shrink: 0;
		min-width: 2.75rem;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		opacity: 0.85;
	}

	.dismiss:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.12);
	}

	.toast-info .dismiss:hover {
		background: var(--color-surface-muted);
	}

	@media (min-width: 560px) {
		.toast-action .toast-message {
			font-size: 1.0625rem;
		}
	}
</style>
