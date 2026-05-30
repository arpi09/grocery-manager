<script lang="ts">
	import { t } from '$lib/i18n';
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

	function confidenceLabel(confidence: ProductFromImage['confidence']): string {
		if (confidence === 'high') return t('photoScan.confidenceHigh');
		if (confidence === 'medium') return t('photoScan.confidenceMedium');
		return t('photoScan.confidenceLow');
	}

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
				message = data.error ?? t('photoScan.readFailed');
				return;
			}

			message = t('photoScan.filledFromPhoto', {
				confidence: confidenceLabel(data.product.confidence)
			});
			onProduct?.(data.product);
		} catch {
			message = t('photoScan.networkError');
		} finally {
			loading = false;
		}
	}
</script>

<ImageSourcePicker
	cameraLabel={loading ? t('photoScan.reading') : t('photoScan.title')}
	fileLabel={loading ? t('photoScan.reading') : t('photoScan.pickFile')}
	disabled={loading}
	onSelect={handlePhotoSelected}
/>
<p class="help">
	{t('photoScan.pickHint')}
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
