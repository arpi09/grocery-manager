<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import ActivationOnboardingScreen from '$lib/components/molecules/ActivationOnboardingScreen.svelte';
	import ActivationProgressChecklist from '$lib/components/molecules/ActivationProgressChecklist.svelte';
	import OnboardingWelcomeIllustration from '$lib/components/organisms/illustrations/OnboardingWelcomeIllustration.svelte';
	import OnboardingScanIllustration from '$lib/components/organisms/illustrations/OnboardingScanIllustration.svelte';
	import OnboardingSuccessIllustration from '$lib/components/organisms/illustrations/OnboardingSuccessIllustration.svelte';
	import OnboardingBrainIllustration from '$lib/components/organisms/illustrations/OnboardingBrainIllustration.svelte';
	import OnboardingShoppingIllustration from '$lib/components/organisms/illustrations/OnboardingShoppingIllustration.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		deriveActivationScreen,
		dismissOnboarding,
		getActivationOnboardingFlags,
		getActivationProgressChecklist,
		getActivationSuccessSnapshot,
		isActivationOnboardingFlowComplete,
		isOnboardingExcludedPath,
		markActivationBrainSeen,
		markActivationScanDeferred,
		markActivationScanStarted,
		markActivationShoppingSeen,
		markActivationSuccessSeen,
		markActivationWelcomeSeen,
		ONBOARDING_PROGRESS_EVENT,
		ONBOARDING_REPLAY_EVENT,
		REGISTRATION_WELCOME_DONE_EVENT,
		shouldShowOnboarding,
		type ActivationScreen
	} from '$lib/utils/onboarding';
	import {
		canSelectProgressKey,
		progressKeyForScreen,
		screenForProgressKey
	} from '$lib/utils/onboarding-steps';
	import type { ActivationProgressKey } from '$lib/utils/onboarding-steps';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';
	import {
		isReceiptImportRecentlyCompleted,
		isReceiptImportToastPending
	} from '$lib/utils/receipt-import-session';

	let open = $state(false);
	let startedTracked = $state(false);
	let lastViewedStep = $state<string | null>(null);
	let registrationWelcomeDone = $state(false);
	let onboardingProgressTick = $state(0);
	let previewScreen = $state<ActivationScreen | null>(null);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);
	const inventoryCount = $derived(
		typeof page.data.activeInventoryCount === 'number' ? page.data.activeInventoryCount : 0
	);
	const flags = $derived.by(() => {
		void onboardingProgressTick;
		return userId ? getActivationOnboardingFlags(userId) : null;
	});
	const flowComplete = $derived.by(() => {
		void onboardingProgressTick;
		return userId ? isActivationOnboardingFlowComplete(userId) : false;
	});
	const skipActivationSuccess = $derived(isReceiptImportRecentlyCompleted());
	const derivedScreen = $derived.by((): ActivationScreen | 'complete' => {
		if (!flags) {
			return 'welcome';
		}
		return deriveActivationScreen(flags, inventoryCount, flowComplete, {
			skipSuccessScreen: skipActivationSuccess
		});
	});
	const displayScreen = $derived.by((): ActivationScreen | 'complete' => {
		if (derivedScreen === 'complete') {
			return 'complete';
		}
		return previewScreen ?? derivedScreen;
	});
	const isPreview = $derived(previewScreen !== null);
	const checklist = $derived(
		flags ? getActivationProgressChecklist(flags, inventoryCount) : null
	);
	const currentProgress = $derived(
		derivedScreen !== 'complete' ? progressKeyForScreen(derivedScreen) : null
	);
	const previewProgress = $derived(
		previewScreen ? progressKeyForScreen(previewScreen) : null
	);
	const successItems = $derived(userId ? getActivationSuccessSnapshot(userId) : []);

	const screenCopy: Record<
		ActivationScreen,
		{ titleKey: MessageKey; bodyKey: MessageKey; ctaKey: MessageKey }
	> = {
		welcome: {
			titleKey: 'onboarding.activation.welcome.title',
			bodyKey: 'onboarding.activation.welcome.body',
			ctaKey: 'onboarding.activation.welcome.cta'
		},
		scan: {
			titleKey: 'onboarding.activation.scan.title',
			bodyKey: 'onboarding.activation.scan.body',
			ctaKey: 'onboarding.activation.scan.ctaPrimary'
		},
		success: {
			titleKey: 'onboarding.activation.success.title',
			bodyKey: 'onboarding.activation.success.body',
			ctaKey: 'onboarding.activation.success.cta'
		},
		brain: {
			titleKey: 'onboarding.activation.brain.title',
			bodyKey: 'onboarding.activation.brain.body',
			ctaKey: 'onboarding.activation.brain.cta'
		},
		shopping: {
			titleKey: 'onboarding.activation.shopping.title',
			bodyKey: 'onboarding.activation.shopping.body',
			ctaKey: 'onboarding.activation.shopping.cta'
		}
	};

	function clearPreview() {
		previewScreen = null;
	}

	function canSelectKey(key: ActivationProgressKey): boolean {
		if (!checklist || !currentProgress) {
			return false;
		}
		return canSelectProgressKey(key, checklist, currentProgress);
	}

	function handleProgressSelect(key: ActivationProgressKey) {
		if (!canSelectKey(key)) {
			return;
		}
		if (currentProgress === key) {
			clearPreview();
			return;
		}
		previewScreen = screenForProgressKey(key);
	}

	function tryOpenFlow() {
		if (
			!browser ||
			!userId ||
			isOnboardingExcludedPath(pathname) ||
			!shouldShowOnboarding(userId) ||
			isReceiptImportToastPending()
		) {
			open = false;
			return;
		}
		if (page.url.searchParams.get('welcome') === '1' && !registrationWelcomeDone) {
			return;
		}
		if (page.url.searchParams.get('freshAccount') === '1') {
			return;
		}
		if (pathname.startsWith('/scan')) {
			open = false;
			return;
		}
		open = true;
	}

	function closeFlow() {
		open = false;
		clearPreview();
	}

	function skipFlow() {
		if (!userId) {
			return;
		}
		dismissOnboarding(userId);
		closeFlow();
		void trackProductEvent('onboarding_skipped');
	}

	function trackStepView(step: ActivationScreen) {
		if (lastViewedStep === step) {
			return;
		}
		lastViewedStep = step;
		void trackProductEvent('onboarding_step_viewed', { step });
		if (step === 'brain') {
			void trackProductEvent('onboarding_brain_viewed');
		}
		if (step === 'shopping') {
			void trackProductEvent('onboarding_shopping_viewed');
		}
	}

	async function handleWelcomeContinue() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationWelcomeSeen(userId);
	}

	async function handleOpenScanner() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationScanStarted(userId);
		void trackProductEvent('onboarding_scan_started');
		closeFlow();
		await goto(receiptOneTapHref(APP_HOME_PATH));
	}

	function handleScanDeferred() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationScanDeferred(userId);
	}

	function handleSuccessContinue() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationSuccessSeen(userId);
	}

	function handleBrainContinue() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationBrainSeen(userId);
	}

	async function handleShoppingContinue() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationShoppingSeen(userId);
		void trackProductEvent('onboarding_completed');
		closeFlow();
		await goto('/inkop?quick=1');
	}

	function handlePreviewContinue() {
		clearPreview();
	}

	$effect(() => {
		if (!browser) {
			return;
		}
		void pathname;
		void userId;
		void inventoryCount;
		tryOpenFlow();
	});

	$effect(() => {
		if (!browser) {
			return;
		}
		const onReplay = () => {
			if (!userId || isOnboardingExcludedPath(pathname)) {
				return;
			}
			startedTracked = false;
			lastViewedStep = null;
			clearPreview();
			open = true;
		};
		window.addEventListener(ONBOARDING_REPLAY_EVENT, onReplay);
		return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, onReplay);
	});

	$effect(() => {
		if (!browser) {
			return;
		}
		const onWelcomeDone = () => {
			registrationWelcomeDone = true;
			tryOpenFlow();
		};
		window.addEventListener(REGISTRATION_WELCOME_DONE_EVENT, onWelcomeDone);
		return () => window.removeEventListener(REGISTRATION_WELCOME_DONE_EVENT, onWelcomeDone);
	});

	$effect(() => {
		if (!browser || !userId || page.url.searchParams.get('welcome') !== '1') {
			return;
		}
		const shownKey = `home-pantry-registration-welcome-shown:${userId}`;
		if (localStorage.getItem(shownKey) === '1') {
			registrationWelcomeDone = true;
			tryOpenFlow();
		}
	});

	$effect(() => {
		if (!browser || !open || !userId) {
			return;
		}
		const onProgress = () => {
			onboardingProgressTick += 1;
			tryOpenFlow();
		};
		window.addEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
		return () => window.removeEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
	});

	$effect(() => {
		void derivedScreen;
		clearPreview();
	});

	$effect(() => {
		if (!open || derivedScreen === 'complete' || isPreview) {
			return;
		}
		if (!startedTracked) {
			startedTracked = true;
			void trackProductEvent('onboarding_started');
		}
		trackStepView(derivedScreen);
	});

	$effect(() => {
		if (!open) {
			return;
		}
		return registerBlockingOverlay();
	});
</script>

{#if open && displayScreen !== 'complete' && checklist}
	<Modal
		open={true}
		onClose={skipFlow}
		variant="sheet"
		dismissible={false}
		panelClass="activation-onboarding-panel"
		bodyClass="activation-onboarding-body"
		label={t('onboarding.activation.dialogAria')}
		showSheetHandle={false}
		data-testid="activation-onboarding"
	>
		{#snippet header()}
			<ModalHeader>
				{#snippet actions()}
					<button type="button" class="skip-link" data-testid="activation-skip" onclick={skipFlow}>
						{t('onboarding.skipLater')}
					</button>
				{/snippet}
			</ModalHeader>
		{/snippet}

		<div class="flow-shell">
			<ActivationProgressChecklist
				{checklist}
				current={currentProgress}
				preview={previewProgress}
				onSelect={handleProgressSelect}
				canSelect={canSelectKey}
			/>

			<div class="flow-content">
				{#key displayScreen}
					<ActivationOnboardingScreen
						title={t(screenCopy[displayScreen].titleKey)}
						body={t(screenCopy[displayScreen].bodyKey)}
					>
						{#snippet illustration()}
							{#if displayScreen === 'welcome'}
								<OnboardingWelcomeIllustration />
							{:else if displayScreen === 'scan'}
								<OnboardingScanIllustration />
							{:else if displayScreen === 'success'}
								<OnboardingSuccessIllustration />
							{:else if displayScreen === 'brain'}
								<OnboardingBrainIllustration />
							{:else}
								<OnboardingShoppingIllustration />
							{/if}
						{/snippet}

						{#snippet extra()}
							{#if displayScreen === 'scan'}
								<p class="kivra-hint">
									{t('onboarding.activation.scan.kivraHint')}
									<a href="/settings/kivra">{t('onboarding.activation.scan.kivraLink')}</a>
								</p>
							{:else if displayScreen === 'success' && successItems.length > 0}
								<ul
									class="success-items"
									aria-label={t('onboarding.activation.success.itemsAria')}
								>
									{#each successItems as item (item.name + item.locationLabel)}
										<li>
											<span class="item-name">{item.name}</span>
											<span class="item-meta">{item.locationLabel}</span>
										</li>
									{/each}
								</ul>
							{/if}
						{/snippet}
					</ActivationOnboardingScreen>
				{/key}
			</div>
		</div>

		{#snippet footer()}
			{#key `${displayScreen}-${isPreview}`}
				<div class="flow-footer">
					{#if isPreview}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handlePreviewContinue}
						>
							{t('onboarding.activation.continueStep')}
						</Button>
					{:else if displayScreen === 'welcome'}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handleWelcomeContinue}
						>
							{t(screenCopy.welcome.ctaKey)}
						</Button>
					{:else if displayScreen === 'scan'}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handleOpenScanner}
						>
							{t('onboarding.activation.scan.ctaPrimary')}
						</Button>
						<Button
							type="button"
							fullWidth
							variant="ghost"
							data-testid="activation-cta-secondary"
							onclick={handleScanDeferred}
						>
							{t('onboarding.activation.scan.ctaSecondary')}
						</Button>
					{:else if displayScreen === 'success'}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handleSuccessContinue}
						>
							{t(screenCopy.success.ctaKey)}
						</Button>
					{:else if displayScreen === 'brain'}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handleBrainContinue}
						>
							{t(screenCopy.brain.ctaKey)}
						</Button>
					{:else}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={handleShoppingContinue}
						>
							{t(screenCopy.shopping.ctaKey)}
						</Button>
					{/if}
				</div>
			{/key}
		{/snippet}
	</Modal>
{/if}

<style>
	:global(.activation-onboarding-panel) {
		width: min(420px, calc(100vw - 2 * var(--space-md)));
	}

	@media (max-width: 767px) {
		:global(.activation-onboarding-panel) {
			left: 0 !important;
			right: 0 !important;
			top: 0 !important;
			bottom: 0 !important;
			width: 100% !important;
			max-height: 100dvh !important;
			height: 100dvh;
			transform: none !important;
			border-radius: 0 !important;
			border: 0;
		}

		:global(.activation-onboarding-panel .modal-body) {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
	}

	:global(.activation-onboarding-body) {
		padding: var(--space-md) var(--space-lg) var(--space-md);
		flex: 1;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	:global(.activation-onboarding-panel .modal-footer) {
		flex-shrink: 0;
		padding: var(--space-md) var(--space-lg);
		padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0));
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.skip-link {
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-sm);
		cursor: pointer;
	}

	.flow-shell {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		flex: 1;
		min-height: 0;
	}

	.flow-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		-webkit-overflow-scrolling: touch;
	}

	.flow-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		animation: footer-enter 280ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes footer-enter {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-footer {
			animation: none;
		}
	}

	.kivra-hint {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.5;
	}

	.kivra-hint a {
		font-weight: 600;
	}

	.success-items {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: 8rem;
		overflow-y: auto;
	}

	.success-items li {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.item-name {
		font-weight: 600;
	}

	.item-meta {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
