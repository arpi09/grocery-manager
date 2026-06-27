<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';
	import type { BrowserMultiFormatReader } from '@zxing/browser';
	import { onDestroy, tick } from 'svelte';
	import { canAccessCamera, BARCODE_HTTPS_HINT } from '$lib/utils/device';

	export type CameraErrorKind = 'https' | 'denied' | 'not_found' | 'unavailable';

	interface Props {
		active?: boolean;
		onScan: (barcode: string) => void;
		onCameraError?: (kind: CameraErrorKind) => void;
		onCameraReady?: () => void;
	}

	let { active = true, onScan, onCameraError, onCameraReady }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let scannerError = $state<string | null>(null);
	let scannerErrorKind = $state<CameraErrorKind | null>(null);
	let scanning = $state(false);
	let facingMode = $state<'environment' | 'user'>('environment');

	let reader: BrowserMultiFormatReader | null = null;
	let stopScanner: (() => void) | null = null;
	let mediaStream: MediaStream | null = null;
	let startGeneration = 0;

	function setCameraError(kind: CameraErrorKind, message: string) {
		scannerErrorKind = kind;
		scannerError = message;
		onCameraError?.(kind);
	}

	function clearCameraError() {
		scannerErrorKind = null;
		scannerError = null;
	}

	function classifyCameraError(error: unknown): CameraErrorKind {
		if (error instanceof DOMException) {
			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				return 'denied';
			}
			if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
				return 'not_found';
			}
		}
		return 'unavailable';
	}

	function cameraErrorMessage(kind: CameraErrorKind): string {
		if (kind === 'denied') {
			return t('scanFlow.cameraDenied');
		}
		if (kind === 'not_found') {
			return t('scanFlow.noCamera');
		}
		return t('scanFlow.cameraUnavailable');
	}

	function stopMediaStream() {
		mediaStream?.getTracks().forEach((track) => track.stop());
		mediaStream = null;
		if (videoEl) {
			videoEl.srcObject = null;
		}
	}

	function stopDecode() {
		if (!stopScanner) {
			return;
		}
		try {
			stopScanner();
		} catch {
			// ZXing may throw if the stream was already torn down.
		}
		stopScanner = null;
	}

	function cleanup() {
		startGeneration += 1;
		stopDecode();
		reader = null;
		stopMediaStream();
		scanning = false;
	}

	async function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
		if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			return;
		}

		await new Promise<void>((resolve, reject) => {
			const onReady = () => {
				video.removeEventListener('loadedmetadata', onReady);
				video.removeEventListener('error', onError);
				resolve();
			};
			const onError = () => {
				video.removeEventListener('loadedmetadata', onReady);
				video.removeEventListener('error', onError);
				reject(new Error('video-metadata-error'));
			};
			video.addEventListener('loadedmetadata', onReady, { once: true });
			video.addEventListener('error', onError, { once: true });
		});
	}

	async function startScanner() {
		const generation = ++startGeneration;
		const video = videoEl;

		if (!video || !active) {
			return;
		}

		stopDecode();
		stopMediaStream();
		clearCameraError();

		if (!canAccessCamera()) {
			setCameraError('https', BARCODE_HTTPS_HINT);
			scanning = false;
			return;
		}

		scanning = true;
		const { BrowserMultiFormatReader: Reader } = await import('@zxing/browser');
		reader = new Reader();

		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: facingMode } },
				audio: false
			});

			if (generation !== startGeneration || !active || videoEl !== video) {
				mediaStream.getTracks().forEach((track) => track.stop());
				mediaStream = null;
				return;
			}

			video.srcObject = mediaStream;
			await waitForVideoReady(video);

			if (generation !== startGeneration || !active || videoEl !== video) {
				return;
			}

			try {
				await video.play();
			} catch {
				// play() can reject when the element is detached during a fast restart.
			}

			if (generation !== startGeneration || !active || videoEl !== video) {
				return;
			}

			const controls = await reader.decodeFromVideoElement(video, (result) => {
				if (!result || generation !== startGeneration) {
					return;
				}
				const code = result.getText().trim();
				if (code.length >= 8) {
					cleanup();
					onScan(code);
				}
			});

			if (generation !== startGeneration) {
				try {
					controls.stop();
				} catch {
					// ignore stale decode session
				}
				return;
			}

			stopScanner = () => controls.stop();
			onCameraReady?.();
		} catch (error) {
			if (generation === startGeneration) {
				const kind = classifyCameraError(error);
				setCameraError(kind, cameraErrorMessage(kind));
				scanning = false;
			}
			stopDecode();
			stopMediaStream();
			reader = null;
		}
	}

	function flipCamera() {
		facingMode = facingMode === 'environment' ? 'user' : 'environment';
	}

	async function retryCamera() {
		if (!active) {
			return;
		}
		clearCameraError();
		await tick();
		if (active && videoEl) {
			void startScanner();
		}
	}

	async function restartForOrientation() {
		if (!active || !videoEl || scannerError) {
			return;
		}
		cleanup();
		await tick();
		if (active && videoEl) {
			void startScanner();
		}
	}

	$effect(() => {
		void facingMode;
		if (!active || !videoEl) {
			cleanup();
			return;
		}

		void startScanner();
		return () => {
			stopDecode();
			stopMediaStream();
			scanning = false;
		};
	});

	$effect(() => {
		if (!browser || !active) {
			return;
		}

		const onOrientation = () => {
			void restartForOrientation();
		};

		window.addEventListener('orientationchange', onOrientation);
		return () => window.removeEventListener('orientationchange', onOrientation);
	});

	onDestroy(cleanup);
</script>

{#if scannerError}
	<div class="camera-error" role="alert">
		<p class="error-message">{scannerError}</p>
		<div class="error-actions">
			{#if scannerErrorKind !== 'not_found'}
				<button type="button" class="retry-btn" onclick={retryCamera}>
					{t('scanFlow.cameraRetry')}
				</button>
			{/if}
		</div>
	</div>
{:else}
	<div class="viewport">
		<video bind:this={videoEl} class="video" playsinline muted></video>
		{#if scanning}
			<div class="frame" aria-hidden="true"></div>
			<button type="button" class="flip-btn" onclick={flipCamera} aria-label={t('scanFlow.flipCamera')}>
				↻
			</button>
		{/if}
	</div>
{/if}

<style>
	.camera-error {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-danger) 25%, var(--color-border));
		border-radius: var(--radius-md);
	}

	.error-message {
		margin: 0;
		color: color-mix(in srgb, var(--color-danger) 70%, var(--color-text));
		font-size: 0.875rem;
		font-weight: 500;
		line-height: 1.45;
	}

	.error-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.5rem 1rem;
		border: 1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.retry-btn:hover {
		background: var(--color-surface-muted);
	}

	.viewport {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--color-text);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.frame {
		position: absolute;
		inset: 15% 10%;
		border: 2px solid rgba(255, 255, 255, 0.85);
		border-radius: var(--radius-sm);
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
		pointer-events: none;
	}

	.flip-btn {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.55);
		color: var(--color-on-primary);
		font-size: 1.25rem;
		cursor: pointer;
	}

	.flip-btn:focus-visible {
		outline: 2px solid var(--color-on-primary);
		outline-offset: 2px;
	}
</style>
