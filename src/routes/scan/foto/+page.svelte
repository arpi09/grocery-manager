<script lang="ts">
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import ProductPhotoScanPicker from '$lib/components/molecules/ProductPhotoScanPicker.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { savePhotoScanPrefill } from '$lib/utils/photo-scan-prefill';

	let { data } = $props();

	let ready = $state(false);

	function handleProduct(product: {
		name: string;
		quantity: string;
		unit: string | null;
		notes: string | null;
	}) {
		savePhotoScanPrefill({
			name: product.name,
			quantity: product.quantity || '1',
			unit: product.unit ?? '',
			notes: product.notes ?? ''
		});
		ready = true;
	}

	function continueToForm() {
		const from = encodeURIComponent(data.returnTo);
		void goto(
			`/item/new?location=${data.defaultLocation}&from=${from}`
		);
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title="Fota produkt" subtitle="AI läser etiketten och fyller i uppgifter" />
	<PageContainer>
		{#if !data.canWrite}
			<p class="readonly" role="status">
				Du har endast läsbehörighet i detta hushåll och kan inte lägga till varor.
			</p>
		{:else}
			<ProductPhotoScanPicker onProduct={handleProduct} />
			{#if ready}
				<div class="continue">
					<Button type="button" fullWidth onclick={continueToForm}>
						Fortsätt och granska
					</Button>
				</div>
			{/if}
		{/if}
		<p class="back">
			<a href="/scan?from={encodeURIComponent(data.returnTo)}">← Alla skanningslägen</a>
		</p>
	</PageContainer>
</AppLayout>

<style>
	.readonly {
		margin: 0;
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}

	.continue {
		margin-top: var(--space-lg);
	}

	.back {
		margin: var(--space-lg) 0 0;
	}

	.back a {
		color: var(--color-text-muted);
		font-weight: 600;
	}
</style>
