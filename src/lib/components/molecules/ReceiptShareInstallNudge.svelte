<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { isNonScanHubReceiptSource, type ReceiptImportSource } from '$lib/domain/receipt-import-source';
	import { t } from '$lib/i18n';
	import {
		canTriggerInstallPrompt,
		dismissReceiptShareInstallNudge,
		isAndroidDevice,
		isReceiptShareInstallNudgeDismissed,
		isStandaloneDisplay,
		promptInstallApp
	} from '$lib/utils/pwa';

	interface Props {
		importSource?: ReceiptImportSource;
	}

	let { importSource }: Props = $props();

	let visible = $state(false);
	let shownTracked = $state(false);

	onMount(() => {
		visible =
			Boolean(importSource && isNonScanHubReceiptSource(importSource)) &&
			isAndroidDevice() &&
			!isStandaloneDisplay() &&
			!isReceiptShareInstallNudgeDismissed();
	});

	$effect(() => {
		if (!visible || shownTracked) return;
		shownTracked = true;
		void trackProductEvent('receipt_share_install_nudge_shown', { source: importSource });
	});

	function handleDismiss() {
		dismissReceiptShareInstallNudge();
		visible = false;
	}

	async function handleInstall() {
		void trackProductEvent('pwa_banner_install_click', { context: 'receipt_share_nudge' });
		const outcome = await promptInstallApp();
		if (outcome === 'accepted') {
			visible = false;
		}
	}
</script>

{#if visible}
	<aside class="share-nudge" data-testid="receipt-share-install-nudge" aria-label={t('receiptAutomation.installNudge.aria')}>
		<div class="share-nudge-copy">
			<strong>{t('receiptAutomation.installNudge.title')}</strong>
			<p>{t('receiptAutomation.installNudge.body')}</p>
		</div>
		<div class="share-nudge-actions">
			{#if canTriggerInstallPrompt()}
				<Button type="button" variant="primary" onclick={handleInstall}>
					{t('receiptAutomation.installNudge.cta')}
				</Button>
			{:else}
				<a class="btn btn-primary" href="/install-app">
					{t('receiptAutomation.installNudge.cta')}
				</a>
			{/if}
			<Button type="button" variant="secondary" onclick={handleDismiss}>
				{t('receiptAutomation.installNudge.dismiss')}
			</Button>
		</div>
	</aside>
{/if}

<style>
	.share-nudge {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.share-nudge-copy strong {
		display: block;
		margin-bottom: 0.25rem;
	}

	.share-nudge-copy p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.share-nudge-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
