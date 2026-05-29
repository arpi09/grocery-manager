<script lang="ts">
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

	let reader: BrowserMultiFormatReader | null = null;
	let stopScanner: (() => void) | null = null;

	function cleanup() {
		stopScanner?.();
		stopScanner = null;
		reader = null;
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
			const devices = await BrowserMultiFormatReader.listVideoInputDevices();
			if (devices.length === 0) {
				scannerError = 'Ingen kamera hittades på enheten.';
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
			scannerError =
				'Kunde inte öppna kameran. Tillåt kameraåtkomst i webbläsarens inställningar.';
			cleanup();
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
		<!-- svelte-ignore a11y_media_has_caption -->
		<video bind:this={videoEl} class="video" playsinline muted></video>
		{#if scanning}
			<div class="frame" aria-hidden="true"></div>
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
</style>
