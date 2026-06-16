<script lang="ts">
	/** Shared modal primitive — frozen API; see docs/MODAL_CONTRACT.md before changing behavior. */
	import { portal } from '$lib/actions/portal';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import {
		focusInitialElement,
		lockBodyScroll,
		restoreFocus,
		saveFocus,
		trapFocus,
		unlockBodyScroll
	} from '$lib/utils/modal-a11y';
	import { t } from '$lib/i18n';
	import type { Snippet } from 'svelte';

	type Variant = 'center' | 'sheet';

	interface Props {
		open: boolean;
		onClose: () => void;
		variant?: Variant;
		dismissible?: boolean;
		title?: string;
		subtitle?: string;
		label?: string;
		nested?: boolean;
		panelClass?: string;
		bodyClass?: string;
		'data-testid'?: string;
		showSheetHandle?: boolean;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
	}

	let {
		open,
		onClose,
		variant = 'center',
		dismissible = true,
		title,
		subtitle,
		label,
		nested = false,
		panelClass = '',
		bodyClass = '',
		'data-testid': dataTestId,
		showSheetHandle = true,
		children,
		header,
		footer
	}: Props = $props();

	const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
	let dialogEl = $state<HTMLDivElement | null>(null);
	let sheetDragY = $state(0);
	let sheetTouchStartY = $state<number | null>(null);
	/** Ignore backdrop clicks in the same tick as open (avoids instant close from trigger click). */
	let openedAt = $state(0);

	const ariaLabel = $derived(label ?? (title ? undefined : t('common.dialog')));
	const ariaLabelledby = $derived(title ? titleId : undefined);

	function requestClose() {
		if (!dismissible) {
			return;
		}
		onClose();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open && dismissible) {
			event.preventDefault();
			requestClose();
		}
	}

	function onBackdropClick() {
		if (performance.now() - openedAt < 500) {
			return;
		}
		requestClose();
	}

	function onPanelClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function resetSheetDrag() {
		sheetTouchStartY = null;
		sheetDragY = 0;
	}

	function onSheetTouchStart(event: TouchEvent) {
		if (variant !== 'sheet' || !dismissible) {
			return;
		}
		sheetTouchStartY = event.touches[0]?.clientY ?? null;
		sheetDragY = 0;
	}

	function onSheetTouchMove(event: TouchEvent) {
		if (sheetTouchStartY === null) {
			return;
		}
		const currentY = event.touches[0]?.clientY ?? sheetTouchStartY;
		sheetDragY = Math.max(0, currentY - sheetTouchStartY);
	}

	function onSheetTouchEnd() {
		if (sheetTouchStartY === null) {
			return;
		}
		if (sheetDragY > 72) {
			requestClose();
		}
		resetSheetDrag();
	}

	$effect(() => {
		if (!open) {
			resetSheetDrag();
			return;
		}
		openedAt = performance.now();
		saveFocus();
		// Defer scroll lock so the first paint can run the sheet transform without layout shift.
		const scrollLockFrame = requestAnimationFrame(() => {
			lockBodyScroll();
		});

		return () => {
			cancelAnimationFrame(scrollLockFrame);
			unlockBodyScroll();
			restoreFocus();
		};
	});

	$effect(() => {
		if (!open || !dialogEl) {
			return;
		}
		const releaseTrap = trapFocus(dialogEl);
		const frame = requestAnimationFrame(() => {
			if (dialogEl) {
				focusInitialElement(dialogEl);
			}
		});

		return () => {
			cancelAnimationFrame(frame);
			releaseTrap();
		};
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<div
		use:portal={'body'}
		class="modal-root"
		class:modal-root--nested={nested}
		class:modal-root--sheet={variant === 'sheet'}
		class:modal-root--center={variant === 'center'}
	>
		<div class="modal-backdrop modal-scrim" onclick={onBackdropClick} aria-hidden="true"></div>

		<div
			bind:this={dialogEl}
			data-testid={dataTestId}
			class="modal-panel {panelClass}"
			class:modal-panel--sheet={variant === 'sheet'}
			class:modal-panel--center={variant === 'center'}
			class:modal-panel--dragging={sheetDragY > 0}
			role="dialog"
			aria-modal="true"
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
			tabindex="-1"
			style:transform={variant === 'sheet' && sheetDragY > 0
				? `translate3d(0, ${sheetDragY}px, 0)`
				: undefined}
			onclick={onPanelClick}
			ontouchstart={onSheetTouchStart}
			ontouchmove={onSheetTouchMove}
			ontouchend={onSheetTouchEnd}
			ontouchcancel={resetSheetDrag}
		>
			{#if variant === 'sheet' && showSheetHandle && dismissible}
				<div class="modal-sheet-handle" aria-hidden="true"></div>
			{/if}

			{#if header}
				{@render header()}
			{:else if title}
				<ModalHeader {title} {subtitle} {titleId} onClose={dismissible ? requestClose : undefined} />
			{/if}

			<div class="modal-body {bodyClass}">
				{@render children()}
			</div>

			{#if footer}
				<footer class="modal-footer">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-root {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		pointer-events: none;
	}

	.modal-root--center {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md);
		padding-top: max(var(--space-md), env(safe-area-inset-top, 0px));
		padding-bottom: max(var(--space-md), env(safe-area-inset-bottom, 0px));
	}

	.modal-root--nested {
		z-index: var(--z-modal-nested);
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		pointer-events: auto;
	}

	.modal-panel {
		position: fixed;
		pointer-events: auto;
		display: flex;
		flex-direction: column;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		color: var(--color-text);
		max-height: min(88vh, 720px);
	}

	.modal-panel--center {
		position: fixed;
		left: 50%;
		top: 50%;
		z-index: 1;
		width: min(560px, calc(100vw - 2 * var(--space-md)));
		max-height: min(85vh, 720px);
		transform: translate(-50%, -50%);
		border-radius: var(--radius-lg);
		overflow: hidden;
		animation: modal-center-in 0.2s ease-out;
	}

	.modal-panel--sheet {
		position: relative;
		width: 100%;
		max-width: 100%;
		max-height: min(88vh, 720px);
		overflow: hidden;
		border-bottom: none;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom, 0));
		transform: translate3d(0, 0, 0);
		animation: modal-sheet-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) backwards;
	}

	.modal-root--sheet {
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	/* Match nav narrow breakpoint (899px) — keep bottom sheet until desktop nav. */
	@media (min-width: 900px) {
		.modal-root--sheet {
			align-items: center;
			padding: var(--space-md);
		}

		.modal-panel--sheet {
			position: relative;
			left: auto;
			right: auto;
			bottom: auto;
			top: auto;
			width: min(520px, calc(100vw - 2rem));
			max-height: min(85vh, 680px);
			transform: none;
			border-radius: var(--radius-lg);
			border-bottom: 1px solid var(--color-border);
			padding-bottom: var(--space-lg);
			animation: modal-sheet-desktop-in 0.2s ease-out backwards;
		}

		.modal-panel--sheet.modal-panel--dragging {
			transform: translateY(var(--sheet-drag-y, 0));
		}
	}

	.modal-sheet-handle {
		width: 2.5rem;
		height: 0.25rem;
		margin: var(--space-sm) auto 0;
		border-radius: 999px;
		background: var(--color-border);
		flex-shrink: 0;
	}

	@media (min-width: 900px) {
		.modal-sheet-handle {
			display: none;
		}
	}

	.modal-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.modal-panel--center .modal-body,
	.modal-panel--sheet .modal-body {
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		scrollbar-color: var(--color-border) transparent;
	}

	.modal-panel--center :global(.modal-header) {
		padding: var(--space-lg) var(--space-lg) var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-panel--center .modal-body {
		padding: var(--space-md) var(--space-lg) var(--space-lg);
	}

	.modal-panel--center:not(:has(:global(.modal-header))) .modal-body {
		padding: var(--space-lg);
	}

	.modal-panel--sheet :global(.modal-header) {
		padding: var(--space-md) var(--space-md) var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.modal-panel--sheet .modal-body {
		padding: 0 var(--space-md) var(--space-md);
	}

	.modal-panel--sheet:not(:has(:global(.modal-header))) .modal-body {
		padding: var(--space-md);
	}

	.modal-footer {
		flex-shrink: 0;
		padding-top: var(--space-md);
	}

	.modal-panel--center.modal-panel--dragging,
	.modal-panel--sheet.modal-panel--dragging {
		transition: transform 0.05s linear;
	}

	@keyframes modal-sheet-desktop-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes modal-center-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 0.75rem)) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	@keyframes modal-sheet-in {
		from {
			opacity: 0;
			transform: translate3d(0, 100%, 0);
		}
		to {
			opacity: 1;
			transform: translate3d(0, 0, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.modal-panel--center,
		.modal-panel--sheet {
			animation: none;
			transform: none;
		}
	}
</style>
