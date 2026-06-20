<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ReceiptImportSuccessStats from '$lib/components/molecules/ReceiptImportSuccessStats.svelte';
	import ReceiptPantrySuccessIllustration from '$lib/components/organisms/illustrations/ReceiptPantrySuccessIllustration.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import {
		clearReceiptImportSuccessPending,
		isReceiptImportToastPending,
		readReceiptImportCompleted,
		type ReceiptImportSessionFlag
	} from '$lib/utils/receipt-import-session';
	import {
		isActivationOnboardingFlowComplete,
		markActivationSuccessSeen,
		ONBOARDING_PROGRESS_EVENT,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';
	import { SCAN_TOAST_NAME_PARAM, SCAN_TOAST_PARAM } from '$lib/utils/scan-toast';

	let open = $state(false);
	let viewedTracked = $state(false);
	let session = $state<ReceiptImportSessionFlag | null>(null);

	const userId = $derived(page.data.user?.id ?? null);
	const memberCount = $derived(page.data.householdMemberCount ?? 0);
	const showInvitePartnerCta = $derived(memberCount === 1);
	const pathname = $derived(page.url.pathname);
	const showContinueSetup = $derived(
		Boolean(userId && shouldShowOnboarding(userId) && !isActivationOnboardingFlowComplete(userId))
	);

	function clearScanToastParams() {
		if (!browser) return;
		if (page.url.searchParams.get(SCAN_TOAST_PARAM) !== 'added' && !page.url.searchParams.has(SCAN_TOAST_NAME_PARAM)) return;
		const url = new URL(page.url);
		url.searchParams.delete(SCAN_TOAST_PARAM);
		url.searchParams.delete(SCAN_TOAST_NAME_PARAM);
		void goto(`${url.pathname}${url.search}${url.hash}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function eventMetadata(flag: ReceiptImportSessionFlag) {
		return { itemsAdded: flag.itemsAdded, locationCounts: flag.locationCounts, estimatedExpiryCount: flag.estimatedExpiryCount };
	}

	function tryOpenMoment() {
		if (!browser || !userId || !isReceiptImportToastPending()) {
			open = false;
			session = null;
			return;
		}
		const flag = readReceiptImportCompleted();
		if (!flag) {
			open = false;
			session = null;
			return;
		}
		session = flag;
		open = true;
		clearScanToastParams();
	}

	function dismissMoment(trackDismiss = true) {
		if (session && trackDismiss) void trackProductEvent('receipt_import_success_dismissed', eventMetadata(session));
		clearReceiptImportSuccessPending();
		open = false;
		if (browser) window.dispatchEvent(new Event(ONBOARDING_PROGRESS_EVENT));
	}

	function markOnboardingSuccessIfNeeded() {
		if (userId && shouldShowOnboarding(userId)) markActivationSuccessSeen(userId);
	}

	async function handlePrimaryCta() {
		if (!session) return;
		const destination = `/inventory/${session.dominantLocation ?? 'fridge'}`;
		void trackProductEvent('receipt_import_success_primary_cta', { ...eventMetadata(session), destination });
		markOnboardingSuccessIfNeeded();
		dismissMoment(false);
		await goto(destination);
	}

	async function handleSecondaryCta() {
		if (!session) return;
		if (showInvitePartnerCta) {
			void trackProductEvent('receipt_import_success_secondary_cta', {
				...eventMetadata(session),
				context: 'receipt_success'
			});
			markOnboardingSuccessIfNeeded();
			dismissMoment(false);
			await goto('/settings#household');
			return;
		}
		void trackProductEvent('receipt_import_success_secondary_cta', eventMetadata(session));
		markOnboardingSuccessIfNeeded();
		dismissMoment(false);
		await goto('/scan');
	}

	async function handleAddMoreCta() {
		if (!session) return;
		void trackProductEvent('receipt_import_success_secondary_cta', {
			...eventMetadata(session),
			context: 'add_more'
		});
		markOnboardingSuccessIfNeeded();
		dismissMoment(false);
		await goto('/scan');
	}

	function handleContinueSetup() {
		markOnboardingSuccessIfNeeded();
		dismissMoment(false);
	}

	$effect(() => { if (browser) { void pathname; void userId; tryOpenMoment(); } });
	$effect(() => {
		if (!open || !session || viewedTracked) return;
		viewedTracked = true;
		void trackProductEvent('receipt_import_success_viewed', eventMetadata(session));
	});
	$effect(() => { if (!open) { viewedTracked = false; return; } return registerBlockingOverlay(); });
</script>

{#if open && session}
	<Modal open={true} onClose={() => dismissMoment(true)} variant="sheet" dismissible={false} panelClass="receipt-import-success-panel" bodyClass="receipt-import-success-body" label={t('receiptImport.success.ariaLabel')} showSheetHandle={false} data-testid="receipt-import-success">
		<div class="success-shell">
			<div class="illus-slot"><ReceiptPantrySuccessIllustration counts={session.locationCounts} /></div>
			<div class="copy-block">
				<h2 class="success-title">{t('receiptImport.success.title')}</h2>
				<p class="success-body">{t('receiptImport.success.body', { count: session.itemsAdded })}</p>
			</div>
			<ReceiptImportSuccessStats counts={session.locationCounts} />
			{#if session.estimatedExpiryCount > 0}
				<p class="expiry-line">{t('receiptImport.success.estimatedExpiry', { count: session.estimatedExpiryCount })}</p>
			{/if}
			{#if (session.linesWithPrice ?? 0) > 0}
				<p class="expiry-line">{t('receiptImport.toastPricesSaved')}</p>
			{/if}
			<div class="action-block">
				<Button type="button" fullWidth variant="primary" data-testid="receipt-success-cta-primary" onclick={handlePrimaryCta}>{t('receiptImport.success.ctaPrimary')}</Button>
				<Button
					type="button"
					fullWidth
					variant="ghost"
					data-testid={showInvitePartnerCta ? 'receipt-success-cta-invite' : 'receipt-success-cta-secondary'}
					onclick={handleSecondaryCta}
				>
					{showInvitePartnerCta ? t('receiptImport.success.ctaInvitePartner') : t('receiptImport.success.ctaSecondary')}
				</Button>
				{#if showInvitePartnerCta}
					<button type="button" class="continue-setup" data-testid="receipt-success-cta-secondary" onclick={handleAddMoreCta}>{t('receiptImport.success.ctaSecondary')}</button>
				{/if}
				{#if showContinueSetup}
					<button type="button" class="continue-setup" data-testid="receipt-success-cta-continue-setup" onclick={handleContinueSetup}>{t('receiptImport.success.ctaContinueSetup')}</button>
				{/if}
			</div>
		</div>
	</Modal>
{/if}

<style>
	:global(.receipt-import-success-panel) { width: min(420px, calc(100vw - 2 * var(--space-md))); }
	@media (max-width: 767px) {
		:global(.receipt-import-success-panel) { left: 0 !important; right: 0 !important; top: 0 !important; bottom: 0 !important; width: 100% !important; max-height: 100dvh !important; height: 100dvh; transform: none !important; border-radius: 0 !important; border: 0; }
		:global(.receipt-import-success-panel .modal-body) { flex: 1; display: flex; flex-direction: column; }
	}
	:global(.receipt-import-success-body) { padding: var(--space-md) var(--space-lg) calc(var(--space-lg) + env(safe-area-inset-bottom, 0)); flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; }
	.success-shell { display: flex; flex-direction: column; gap: var(--space-lg); flex: 1; min-height: 0; }
	.illus-slot { display: flex; align-items: center; justify-content: center; min-height: 9rem; padding-block: var(--space-sm); }
	.copy-block { display: flex; flex-direction: column; gap: var(--space-md); text-align: center; max-width: 22rem; margin-inline: auto; }
	.success-title { margin: 0; font-size: clamp(1.5rem, 5vw, 1.75rem); line-height: 1.2; font-weight: 700; letter-spacing: -0.02em; }
	.success-body { margin: 0; font-size: 1.0625rem; line-height: 1.6; color: var(--color-text-muted); }
	.expiry-line { margin: 0; text-align: center; font-size: 0.9375rem; color: var(--color-text-muted); }
	.action-block { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: auto; padding-top: var(--space-md); }
	.action-block :global(.btn) { min-height: var(--touch-target-min); }
	.continue-setup { border: none; background: none; color: var(--color-text-muted); font-size: 0.9375rem; font-weight: 600; min-height: var(--touch-target-min); cursor: pointer; text-decoration: underline; padding: var(--space-xs); }
</style>
