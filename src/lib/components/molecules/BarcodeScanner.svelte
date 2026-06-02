<script lang="ts">
	import { t } from '$lib/i18n';
	import { BrowserMultiFormatReader } from '@zxing/browser';
	import { onDestroy } from 'svelte';
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

	function stopMediaStream() {
		mediaStream?.getTracks().forEach((track) => track.stop());
		mediaStream = null;
		if (videoEl) {
			videoEl.srcObject = null;
		}
	}

	function cleanup() {
		stopScanner?.();
		stopScanner = null;
		reader = null;
		stopMediaStream();
		scanning = false;
	}

	async function startScanner() {
		if (!videoEl || !active) {
			return;
		}

		cleanup();
		scannerError = null;

		if (!canAccessCamera()) {
			scannerError = BARCODE_HTTPS_HINT;
			return;
		}

		scanning = true;
		reader = new BrowserMultiFormatReader();

		try {
			mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: facingMode } },
				audio: false
			});
			videoEl.srcObject = mediaStream;
			await videoEl.play();

			const controls = await reader.decodeFromVideoElement(videoEl, (result) => {
				if (!result) {
					return;
				}
				const code = result.getText().trim();
				if (code.length >= 8) {
					cleanup();
					onScan(code);
				}
			});

			stopScanner = () => controls.stop();
		} catch {
			scannerError = t('scanFlow.cameraDenied');
			cleanup();
		}
	}

	function flipCamera() {
		facingMode = facingMode === 'environment' ? 'user' : 'environment';
		if (active && videoEl) {
			void startScanner();
		}
	}

	$effect(() => {
		if (active && videoEl) {
			void startScanner();
		} else {
			cleanup();
		}
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
