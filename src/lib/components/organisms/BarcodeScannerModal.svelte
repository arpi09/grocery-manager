<script lang="ts">
	import { BrowserMultiFormatReader } from '@zxing/browser';
	import { onDestroy } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { canAccessCamera, BARCODE_HTTPS_HINT } from '$lib/utils/device';

	interface Props {
		open: boolean;
		onScan: (barcode: string) => void;
		onClose: () => void;
	}

	let { open, onScan, onClose }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let scannerError = $state<string | null>(null);
	let scanning = $state(false);

	let reader: BrowserMultiFormatReader | null = null;
	let stopScanner: (() => void) | null = null;

	function cleanup() {
		stopScanner?.();
		stopScanner = null;
		reader = null;
		scanning = false;
	}

	async function startScanner() {
		if (!videoEl || !open) {
			return;
		}

		cleanup();
		scannerError = null;

		if (!canAccessCamera()) {
			scannerError = BARCODE_HTTPS_HINT;
			scanning = false;
			return;
		}

		scanning = true;

		reader = new BrowserMultiFormatReader();

		try {
			const devices = await BrowserMultiFormatReader.listVideoInputDevices();
			if (devices.length === 0) {
				scannerError = 'No camera found on this device.';
				scanning = false;
				return;
			}

			const preferred =
				devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];

			const controls = await reader.decodeFromVideoDevice(
				preferred.deviceId,
				videoEl,
				(result) => {
					if (!result) {
						return;
					}
					const code = result.getText().trim();
					if (code.length >= 8) {
						cleanup();
						onScan(code);
					}
				}
			);

			stopScanner = () => controls.stop();
		} catch {
			scannerError = 'Could not open the camera. Allow camera access in your browser settings.';
			cleanup();
		}
	}

	$effect(() => {
		if (open && videoEl) {
			void startScanner();
		} else {
			cleanup();
		}
	});

	onDestroy(cleanup);
</script>

{#if open}
	<div class="overlay" role="dialog" aria-modal="true" aria-label="Scan barcode">
		<div class="panel">
			<header>
				<h2>Scan barcode</h2>
				<button type="button" class="close" onclick={onClose} aria-label="Close">×</button>
			</header>

			<p class="hint">Point your camera at the product barcode.</p>

			{#if scannerError}
				<p class="error" role="alert">{scannerError}</p>
			{:else}
				<div class="viewport">
					<!-- svelte-ignore a11y_media_has_caption -->
					<video bind:this={videoEl} class="video" playsinline muted></video>
					{#if scanning}
						<div class="frame" aria-hidden="true"></div>
					{/if}
				</div>
			{/if}

			<Button type="button" variant="secondary" fullWidth onclick={onClose}>Cancel</Button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(31, 42, 36, 0.65);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: var(--space-md);
	}

	.panel {
		width: 100%;
		max-width: 400px;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-sm);
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
	}

	.close {
		border: none;
		background: transparent;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: var(--color-text-muted);
		padding: 0.25rem;
	}

	.hint {
		margin: 0 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.error {
		margin: 0 0 var(--space-md);
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
		margin-bottom: var(--space-md);
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
</style>
