<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import InstallAppBanner from '$lib/components/molecules/InstallAppBanner.svelte';
	import OnboardingCelebrateIllustration from '$lib/components/organisms/OnboardingCelebrateIllustration.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import { getPeakInventoryCount } from '$lib/utils/household-invite-prompt';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import {
		clearCelebrationPending,
		getActivationProgress,
		isOnboardingExcludedPath,
		ONBOARDING_PROGRESS_EVENT,
		shouldShowCelebration,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';
	import { isReceiptImportToastPending } from '$lib/utils/receipt-import-session';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';

	let open = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);
	const activationProgress = $derived(userId ? getActivationProgress(userId) : null);
	const itemCount = $derived(userId ? getPeakInventoryCount(userId) : 0);
	const celebrateBody = $derived(
		activationProgress?.path === 'receipt' && itemCount > 0
			? t('onboarding.celebrateReceiptBody', { count: itemCount })
			: activationProgress?.path === 'shopping'
				? t('onboarding.celebrateStartedBody')
				: t('onboarding.celebrateBody')
	);
	const showPwaInstall = $derived(activationProgress?.path === 'receipt');
	const showScanSecondary = $derived(
		activationProgress?.path !== 'shopping' && activationProgress?.path !== 'receipt'
	);

	function tryOpenCelebration() {
		if (
			!browser ||
			!userId ||
			isOnboardingExcludedPath(pathname) ||
			shouldShowOnboarding(userId) ||
			isReceiptImportToastPending() ||
			!shouldShowCelebration(userId)
		) {
			open = false;
			return;
		}
		open = true;
	}

	function closeCelebration() {
		clearCelebrationPending(userId);
		open = false;
	}

	async function goHome() {
		closeCelebration();
		if (pathname !== APP_HOME_PATH) {
			await goto(APP_HOME_PATH);
		}
	}

	async function goShopping() {
		closeCelebration();
		await goto('/inkop');
	}

	async function goScan() {
		closeCelebration();
		const progress = getActivationProgress(userId);
		const mode =
			progress.path === 'receipt'
				? 'receipt'
				: progress.path === 'barcode'
					? 'barcode'
					: 'photo';
		await goto(scanModeHref(mode, APP_HOME_PATH));
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenCelebration();

		const onProgress = () => tryOpenCelebration();
		window.addEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
		return () => window.removeEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
	});

	$effect(() => {
		if (!open) {
			return;
		}
		return registerBlockingOverlay('celebration');
	});
</script>

<Modal
	{open}
	onClose={goHome}
	variant="center"
	dismissible={true}
	panelClass="celebration-panel"
	title={t('onboarding.celebrateTitle')}
>
	<div class="celebration-body">
		<OnboardingCelebrateIllustration />
		<p class="celebrate-lead">{celebrateBody}</p>
		{#if showPwaInstall}
			<InstallAppBanner installHref="/install-app" />
		{/if}
		<div class="celebration-actions">
			<Button type="button" fullWidth data-testid="celebration-primary-cta" onclick={goShopping}>
				{t('onboarding.celebrateCtaShopping')}
			</Button>
			{#if showScanSecondary}
				<Button type="button" fullWidth variant="secondary" data-testid="celebration-secondary-cta" onclick={goScan}>
					{t('onboarding.celebrateCtaScan')}
				</Button>
			{/if}
		</div>
		<button type="button" class="dismiss-link" data-testid="celebration-dismiss-home" onclick={goHome}>
			{t('onboarding.celebrateDismiss')}
		</button>
	</div>
</Modal>

<style>
	:global(.celebration-panel) {
		width: min(380px, calc(100vw - 2 * var(--space-md)));
		max-height: min(90dvh, 28rem);
	}

	:global(.celebration-panel .modal-body) {
		overflow-y: auto;
	}

	.celebration-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-lg) var(--space-xl) var(--space-xl);
		text-align: center;
		box-sizing: border-box;
	}

	.celebrate-lead {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		max-width: 100%;
		padding: 0 var(--space-xs);
		overflow-wrap: anywhere;
	}

	.celebration-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
	}

	.dismiss-link {
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		cursor: pointer;
		padding: var(--space-xs);
		text-decoration: underline;
	}
</style>
