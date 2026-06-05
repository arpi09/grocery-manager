<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';
	import type { BrowserMultiFormatReader } from '@zxing/browser';
	import { onDestroy, tick } from 'svelte';
	import { canAccessCamera, BARCODE_HTTPS_HINT } from '$lib/utils/device';

	interface Props {
		active?: boolean;
		onScan: (barcode: string) => void;
	}

	let { active = true, onScan }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let scannerError = $state<string | null>(null);
	let scanning = $state(false);
	let facingMode = $state<'environment' | 'user'>('environment');

	let reader: BrowserMultiFormatReader | null = null;
	let stopScanner: (() => void) | null = null;
	let mediaStream: MediaStream | null = null;
	let startGeneration = 0;

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
		scannerError = null;

		if (!canAccessCamera()) {
			scannerError = BARCODE_HTTPS_HINT;
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
		} catch {
			if (generation === startGeneration) {
				scannerError = t('scanFlow.cameraDenied');
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
	<p class="error" role="alert">{scannerError}</p>
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
	.error {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		background: #fdeaea;
		color: var(--color-danger);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
	}

	.viewport {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		background: #111;
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
		color: #fff;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.flip-btn:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
</style>
