<script lang="ts">
	import ImageSourcePicker from '$lib/components/molecules/ImageSourcePicker.svelte';

	interface ProductFromImage {
		name: string;
		quantity: string;
		unit: string | null;
		notes: string | null;
		confidence: 'high' | 'medium' | 'low';
	}

	interface Props {
		onProduct?: (product: ProductFromImage) => void;
	}

	let { onProduct }: Props = $props();

	let loading = $state(false);
	let message = $state<string | null>(null);

	async function handlePhotoSelected(file: File) {
		loading = true;
		message = null;

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/product-from-image', {
				method: 'POST',
				body: formData
			});

			const data = (await response.json()) as {
				error?: string;
				product?: ProductFromImage;
			};

			if (!response.ok || !data.product) {
				message = data.error ?? 'Kunde inte läsa produkten från bilden. Försök med en tydligare bild.';
				return;
			}

			const confidenceLabel =
				data.product.confidence === 'high'
					? 'hög'
					: data.product.confidence === 'medium'
						? 'medel'
						: 'låg';
			message = `Fyllde i uppgifter från fotot (säkerhet: ${confidenceLabel}). Kontrollera innan du sparar.`;
			onProduct?.(data.product);
		} catch {
			message = 'Nätverksfel vid analys av bilden.';
		} finally {
			loading = false;
		}
	}
</script>

<ImageSourcePicker
	cameraLabel={loading ? 'Läser produkten…' : '📷 Fota produkt'}
	fileLabel={loading ? 'Läser produkten…' : '📁 Välj bild från filer'}
	disabled={loading}
	onSelect={handlePhotoSelected}
/>
<p class="help">
	Ta en tydlig bild av produktetiketten så fyller vi i namn, mängd och enhet åt dig.
</p>
{#if message}
	<p class="status" role="status">{message}</p>
{/if}

<style>
	.help {
		margin: var(--space-md) 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.status {
		margin: var(--space-sm) 0 0;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
