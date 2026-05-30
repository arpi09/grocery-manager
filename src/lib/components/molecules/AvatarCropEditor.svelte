<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import {
		AVATAR_CROP_MAX_ZOOM,
		AVATAR_CROP_MIN_ZOOM,
		AVATAR_CROP_VIEWPORT_SIZE,
		clampAvatarCropParams,
		cropAvatarToBlob,
		defaultAvatarCropParams,
		drawAvatarCrop,
		loadImageElement,
		type AvatarCropParams
	} from '$lib/utils/crop-image';

	interface Props {
		open: boolean;
		imageUrl: string;
		onClose: () => void;
		onApply: (blob: Blob) => void | Promise<void>;
	}

	let { open, imageUrl, onClose, onApply }: Props = $props();

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let image = $state<HTMLImageElement | null>(null);
	let params = $state<AvatarCropParams>(defaultAvatarCropParams());
	let applying = $state(false);
	let dragging = $state(false);
	let dragStart = $state<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

	const cropSize = AVATAR_CROP_VIEWPORT_SIZE;

	$effect(() => {
		if (!open || !imageUrl) {
			image = null;
			params = defaultAvatarCropParams();
			return;
		}

		let cancelled = false;

		loadImageElement(imageUrl)
			.then((loaded) => {
				if (!cancelled) {
					image = loaded;
					params = defaultAvatarCropParams();
					queueMicrotask(renderPreview);
				}
			})
			.catch(() => {
				if (!cancelled) {
					onClose();
				}
			});

		return () => {
			cancelled = true;
		};
	});

	function renderPreview() {
		if (!canvasEl || !image) {
			return;
		}

		const ctx = canvasEl.getContext('2d');
		if (!ctx) {
			return;
		}

		drawAvatarCrop(ctx, image, image.naturalWidth, image.naturalHeight, params, cropSize);
	}

	$effect(() => {
		if (!canvasEl || !image) return;
		renderPreview();
	});

	function updateParams(next: AvatarCropParams) {
		if (!image) {
			params = next;
			return;
		}

		params = clampAvatarCropParams(image.naturalWidth, image.naturalHeight, cropSize, next);
	}

	function onPointerDown(event: PointerEvent) {
		if (!image || applying) {
			return;
		}

		dragging = true;
		dragStart = {
			x: event.clientX,
			y: event.clientY,
			offsetX: params.offsetX,
			offsetY: params.offsetY
		};
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging || !dragStart) {
			return;
		}

		updateParams({
			...params,
			offsetX: dragStart.offsetX + (event.clientX - dragStart.x),
			offsetY: dragStart.offsetY + (event.clientY - dragStart.y)
		});
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		dragging = false;
		dragStart = null;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	function onZoomInput(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		updateParams({ ...params, zoom: value });
	}

	async function applyCrop() {
		if (!image || applying) {
			return;
		}

		applying = true;
		try {
			const blob = await cropAvatarToBlob(image, params);
			await onApply(blob);
		} finally {
			applying = false;
		}
	}
</script>

<Modal
	{open}
	onClose={onClose}
	variant="sheet"
	title={t('profile.cropTitle')}
	subtitle={t('profile.cropLead')}
	panelClass="avatar-crop-panel"
	bodyClass="avatar-crop-body"
	dismissible={!applying}
>
	<div class="crop-stage">
		<div
			class="crop-viewport"
			role="application"
			aria-label={t('profile.cropTitle')}
			tabindex="0"
			style={`--crop-size: ${cropSize}px`}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
		>
			<canvas
				bind:this={canvasEl}
				class="crop-canvas"
				width={cropSize}
				height={cropSize}
				aria-hidden="true"
			></canvas>
			<div class="crop-ring" aria-hidden="true"></div>
		</div>
		<p class="crop-hint">{t('profile.cropHint')}</p>
	</div>

	<label class="zoom-control">
		<span>{t('profile.cropZoom')}</span>
		<input
			type="range"
			min={AVATAR_CROP_MIN_ZOOM}
			max={AVATAR_CROP_MAX_ZOOM}
			step="0.01"
			value={params.zoom}
			disabled={!image || applying}
			oninput={onZoomInput}
		/>
	</label>

	<div class="crop-actions">
		<Button type="button" variant="secondary" fullWidth disabled={applying} onclick={onClose}>
			{t('common.cancel')}
		</Button>
		<Button
			type="button"
			variant="primary"
			fullWidth
			loading={applying}
			loadingLabel={t('profile.uploadingAvatar')}
			disabled={!image}
			onclick={applyCrop}
		>
			{t('profile.cropApply')}
		</Button>
	</div>
</Modal>

<style>
	:global(.avatar-crop-panel) {
		max-width: 28rem;
	}

	:global(.avatar-crop-body) {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.crop-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
	}

	.crop-viewport {
		position: relative;
		width: var(--crop-size);
		height: var(--crop-size);
		border-radius: 999px;
		overflow: hidden;
		touch-action: none;
		cursor: grab;
		background: var(--color-surface-muted);
		box-shadow: inset 0 0 0 1px var(--color-border);
	}

	.crop-viewport:active {
		cursor: grabbing;
	}

	.crop-canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.crop-ring {
		position: absolute;
		inset: 0;
		border-radius: 999px;
		box-shadow:
			0 0 0 9999px color-mix(in srgb, var(--color-text) 45%, transparent),
			inset 0 0 0 2px color-mix(in srgb, var(--color-surface) 85%, transparent);
		pointer-events: none;
	}

	.crop-hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-align: center;
		max-width: 18rem;
	}

	.zoom-control {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.zoom-control input[type='range'] {
		width: 100%;
		accent-color: var(--color-primary);
	}

	.crop-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}
</style>
