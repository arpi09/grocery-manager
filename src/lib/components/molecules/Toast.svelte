<script lang="ts">
	import { portal } from '$lib/actions/portal';
	import { t } from '$lib/i18n';
	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';
	import type { Snippet } from 'svelte';

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
		/** When false, render inline (e.g. undo row with companion button) instead of portaling to body */
		portal?: boolean;
		/** Inline action buttons (e.g. undo) rendered inside the toast bar */
		actions?: Snippet;
		'data-testid'?: string;
		onDismiss?: () => void;
	}

	let {
		message,
		visible = true,
		durationMs = TOAST_DEFAULT_DURATION_MS,
		variant = 'default',
		size = 'compact',
		celebrate = false,
		tapToDismiss = true,
		portal: usePortal = true,
		actions,
		'data-testid': dataTestId,
		onDismiss
	}: Props = $props();

	let show = $state(visible);
	let paused = $state(false);

	const toastRole = $derived(variant === 'error' ? 'alert' : 'status');
	const toastLive = $derived(variant === 'error' ? 'assertive' : 'polite');

	$effect(() => {
		show = visible;
	});

	$effect(() => {
		if (!visible || !message || paused) {
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

	function handlePointerEnter() {
		paused = true;
	}

	function handlePointerLeave() {
		paused = false;
	}
</script>

{#if show && message}
	<div
		use:portal={usePortal ? 'body' : undefined}
		class="toast motion-slide-up"
		class:toast-inline={!usePortal}
		class:toast-celebrate={celebrate}
		class:toast-success={variant === 'success'}
		class:toast-error={variant === 'error'}
		class:toast-info={variant === 'info'}
		class:toast-action={size === 'action'}
		class:toast-tappable={tapToDismiss && !!onDismiss}
		class:toast-with-actions={!!actions}
		data-testid={dataTestId}
		role={toastRole}
		aria-live={toastLive}
		onclick={handleToastClick}
		onpointerenter={handlePointerEnter}
		onpointerleave={handlePointerLeave}
	>
		{#if variant === 'success'}
			<span class="toast-icon" aria-hidden="true">✓</span>
		{:else if variant === 'error'}
			<span class="toast-icon" aria-hidden="true">!</span>
		{:else if variant === 'info'}
			<span class="toast-icon" aria-hidden="true">i</span>
		{/if}
		<p class="toast-message">{message}</p>
		{#if actions}
			<div class="toast-actions" onclick={(event) => event.stopPropagation()}>
				{@render actions()}
			</div>
		{/if}
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
		background: var(--toast-bg);
		color: var(--toast-fg);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		border: 1px solid color-mix(in srgb, var(--toast-fg) 12%, transparent);
	}

	.toast-inline {
		position: static;
		left: auto;
		bottom: auto;
		transform: none;
		z-index: auto;
		flex: 1;
		min-width: 0;
	}

	.toast-action {
		width: min(28rem, calc(100vw - 2 * var(--space-md)));
		max-width: min(28rem, calc(100vw - 2 * var(--space-md)));
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		cursor: pointer;
	}

	.toast-tappable {
		cursor: pointer;
	}

	.toast-success {
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-color: color-mix(in srgb, var(--color-primary) 80%, #000);
	}

	.toast-error {
		background: var(--color-danger);
		color: var(--color-on-primary);
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

	.toast-info .dismiss {
		color: var(--color-text-muted);
	}

	.toast-info .dismiss:hover {
		background: var(--color-surface-muted);
		color: var(--color-text);
	}

	.toast-celebrate {
		background: linear-gradient(
			135deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 55%, var(--toast-bg))
		);
		color: var(--color-on-primary);
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
		background: var(--toast-icon-bg);
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
		color: inherit;
	}

	.toast-action .toast-message {
		font-size: 1rem;
		line-height: 1.45;
	}

	.toast-with-actions {
		padding-right: var(--space-sm);
	}

	.toast-actions {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toast-actions :global(.toast-action-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0 var(--space-sm);
		border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-surface) 18%, transparent);
		color: inherit;
		font-size: 0.875rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
	}

	.toast-actions :global(.toast-action-btn:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--color-surface) 32%, transparent);
	}

	.toast-actions :global(.toast-action-btn:disabled) {
		opacity: 0.6;
		cursor: not-allowed;
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
		background: var(--toast-dismiss-hover);
	}

	@media (min-width: 560px) {
		.toast-action .toast-message {
			font-size: 1.0625rem;
		}
	}
</style>
