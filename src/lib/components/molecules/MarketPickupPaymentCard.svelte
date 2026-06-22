<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import {
		buildSwishPaymentUrl,
		formatSwedishMobileForDisplay,
		maskSwedishMobileNumber,
		normalizeSwedishMobileNumber
	} from '$lib/domain/market-pricing';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		askingPriceSek: number;
		sharerSwishNumber: string | null;
		sharerFirstName: string;
		isSeeker: boolean;
		threadId: string;
	}

	let { askingPriceSek, sharerSwishNumber, sharerFirstName, isSeeker, threadId }: Props = $props();

	const normalizedSwish = $derived(
		sharerSwishNumber ? normalizeSwedishMobileNumber(sharerSwishNumber) : null
	);
	const maskedSwish = $derived(
		normalizedSwish ? maskSwedishMobileNumber(normalizedSwish) : null
	);
	const swishUrl = $derived(
		normalizedSwish && isSeeker
			? buildSwishPaymentUrl({
					swishNumber: normalizedSwish,
					amountSek: askingPriceSek,
					message: t('marketV04.swishMessage', { name: sharerFirstName })
				})
			: null
	);

	async function copySwishNumber() {
		if (!normalizedSwish) {
			return;
		}
		try {
			await navigator.clipboard.writeText(formatSwedishMobileForDisplay(normalizedSwish));
			showClientToast(t('marketV04.swishCopied'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV04.swishCopyFailed'), { variant: 'error' });
		}
	}

	function openSwish() {
		if (!swishUrl) {
			return;
		}
		void fetch('/api/product-events', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventType: 'market_swish_link_opened',
				metadata: { threadId, amountSek: askingPriceSek }
			})
		}).catch(() => {
			// analytics is best-effort
		});
		window.location.href = swishUrl;
	}
</script>

<section class="payment-card" aria-labelledby="market-pickup-payment-heading" data-testid="market-pickup-payment-card">
	<Card class="payment-card-inner">
		<h2 id="market-pickup-payment-heading">{t('marketV04.pickupPaymentTitle')}</h2>
		<p class="price-line">
			{t('marketV04.askingPrice', { price: askingPriceSek })}
		</p>
		<p class="tip">{t('marketV04.meetupTip')}</p>

		{#if normalizedSwish}
			<div class="swish-row">
				<div>
					<p class="swish-label">{t('marketV04.pickupSwishNumberLabel', { name: sharerFirstName })}</p>
					<p class="swish-value" data-testid="market-pickup-swish-masked">{maskedSwish}</p>
				</div>
				<Button type="button" variant="secondary" onclick={() => void copySwishNumber()}>
					{t('marketV04.copySwishBtn')}
				</Button>
			</div>
		{:else if isSeeker}
			<p class="swish-missing">{t('marketV04.swishMissing', { name: sharerFirstName })}</p>
		{/if}

		{#if swishUrl}
			<Button type="button" onclick={openSwish} data-testid="market-open-swish-btn">
				{t('marketV04.openSwishBtn')}
			</Button>
		{/if}

		<p class="disclaimer">{t('marketV04.paymentDisclaimer')}</p>
	</Card>
</section>

<style>
	.payment-card {
		margin-bottom: var(--space-md);
	}

	:global(.payment-card-inner) {
		display: grid;
		gap: var(--space-sm);
		border-color: var(--color-primary);
	}

	h2 {
		margin: 0;
		font-size: 1rem;
	}

	.price-line {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
	}

	.tip,
	.disclaimer,
	.swish-missing {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.swish-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.swish-label {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.swish-value {
		margin: var(--space-2xs) 0 0;
		font-family: ui-monospace, monospace;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
