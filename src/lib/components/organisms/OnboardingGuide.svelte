<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		ONBOARDING_PROGRESS_EVENT,
		ONBOARDING_REPLAY_EVENT,
		ONBOARDING_STEP_COUNT,
		REGISTRATION_WELCOME_DONE_EVENT,
		clearCelebrationPending,
		completeOnboarding,
		dismissOnboarding,
		isActivationComplete,
		isOnboardingExcludedPath,
		setActivationPath,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';
	import { canGoBackOnboarding, isLastOnboardingStep, type OnboardingStepId } from '$lib/utils/onboarding-steps';

	interface Step {
		id: OnboardingStepId;
		titleKey: MessageKey;
		bodyKey: MessageKey;
	}

	const stepDefinitions: Step[] = [
		{
			id: 'welcome',
			titleKey: 'onboarding.beatWhatTitle',
			bodyKey: 'onboarding.welcomeBodyShoppingList'
		},
		{
			id: 'pathGuide',
			titleKey: 'onboarding.beatLoopTitle',
			bodyKey: 'onboarding.beatLoopBody'
		},
		{
			id: 'celebrate',
			titleKey: 'onboarding.beatHowTitle',
			bodyKey: 'onboarding.beatHowBody'
		}
	];

	let open = $state(false);
	let stepIndex = $state(0);
	let stepDirection = $state<'forward' | 'back'>('forward');
	let registrationWelcomeDone = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	const steps = $derived(
		stepDefinitions.map((step, index) => ({
			...step,
			title: t(step.titleKey),
			subtitle: t('onboarding.stepOf', { current: index + 1, total: ONBOARDING_STEP_COUNT }),
			body: t(step.bodyKey)
		}))
	);

	const currentStep = $derived(steps[stepIndex]);
	const isFirstStep = $derived(stepIndex === 0);
	const isLastStep = $derived(isLastOnboardingStep(stepIndex));
	const canGoBack = $derived(canGoBackOnboarding(stepIndex));

	function tryOpenGuide() {
		if (!browser || !userId || isOnboardingExcludedPath(pathname) || !shouldShowOnboarding(userId)) {
			return;
		}
		if (page.url.searchParams.get('welcome') === '1' && !registrationWelcomeDone) {
			return;
		}
		if (page.url.searchParams.get('freshAccount') === '1') {
			return;
		}
		if (pathname.startsWith('/scan')) {
			return;
		}
		stepIndex = 0;
		open = true;
	}

	function closeGuide() {
		open = false;
	}

	function skipGuide() {
		if (!userId) return;
		dismissOnboarding(userId);
		closeGuide();
		void trackProductEvent('onboarding_skipped');
	}

	function goBack() {
		if (isFirstStep) return;
		stepDirection = 'back';
		stepIndex -= 1;
	}

	function advanceStep() {
		if (userId && stepIndex === 0) {
			setActivationPath('shopping', userId);
		}
		if (isLastStep) {
			void finishGuideToList();
			return;
		}
		stepDirection = 'forward';
		stepIndex += 1;
	}

	async function finishGuideToList() {
		if (!userId) return;
		clearCelebrationPending(userId);
		completeOnboarding(userId);
		closeGuide();
		await goto('/inkop?quick=1');
	}

	function syncCelebrateStep() {
		if (!open || !userId || !isActivationComplete(userId) || stepIndex >= 2) {
			return;
		}
		stepDirection = 'forward';
		stepIndex = 2;
	}

	$effect(() => {
		if (!browser) return;
		void pathname;
		void userId;
		tryOpenGuide();
	});

	$effect(() => {
		if (!browser) return;
		const onReplay = () => {
			if (!userId || isOnboardingExcludedPath(pathname)) return;
			stepIndex = 0;
			open = true;
		};
		window.addEventListener(ONBOARDING_REPLAY_EVENT, onReplay);
		return () => window.removeEventListener(ONBOARDING_REPLAY_EVENT, onReplay);
	});

	$effect(() => {
		if (!browser) return;
		const onWelcomeDone = () => {
			registrationWelcomeDone = true;
			tryOpenGuide();
		};
		window.addEventListener(REGISTRATION_WELCOME_DONE_EVENT, onWelcomeDone);
		return () => window.removeEventListener(REGISTRATION_WELCOME_DONE_EVENT, onWelcomeDone);
	});

	$effect(() => {
		if (!browser || !userId || page.url.searchParams.get('welcome') !== '1') return;
		const shownKey = `home-pantry-registration-welcome-shown:${userId}`;
		if (localStorage.getItem(shownKey) === '1') {
			registrationWelcomeDone = true;
			tryOpenGuide();
		}
	});

	$effect(() => {
		if (!browser || !open || !userId) return;
		syncCelebrateStep();
		const onProgress = () => syncCelebrateStep();
		window.addEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
		return () => window.removeEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
	});

	$effect(() => {
		if (!open) return;
		return registerBlockingOverlay();
	});
</script>

<Modal
	open={open}
	onClose={skipGuide}
	variant="sheet"
	dismissible={false}
	panelClass="onboarding-panel"
	bodyClass="onboarding-body"
	label={t('onboarding.dialogAria')}
	showSheetHandle={false}
>
	{#snippet header()}
		<ModalHeader
			title={currentStep.title}
			subtitle={currentStep.subtitle}
			subtitleTestId="onboarding-step-indicator"
		>
			{#snippet actions()}
				<button type="button" class="skip-link" data-testid="onboarding-skip" onclick={skipGuide}>
					{t('onboarding.skipLater')}
				</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div
		class="step-content"
		class:step-forward={stepDirection === 'forward'}
		class:step-back={stepDirection === 'back'}
	>
		<div class="progress-track" aria-hidden="true">
			<div
				class="progress-fill"
				style={`width: ${((stepIndex + 1) / ONBOARDING_STEP_COUNT) * 100}%`}
			></div>
		</div>

		<p class="step-body">{currentStep.body}</p>

		<Button
			type="button"
			fullWidth
			variant="primary"
			data-testid={isLastStep ? 'onboarding-finish' : 'onboarding-next'}
			data-analytics-id={isLastStep ? 'onboarding.finish' : 'onboarding.next'}
			onclick={advanceStep}
		>
			{isLastStep ? t('onboarding.openShoppingList') : t('common.next')}
		</Button>
	</div>

	{#snippet footer()}
		<div class="onboarding-footer">
			<div class="step-dots" role="tablist" aria-label={t('onboarding.stepsAria')}>
				{#each steps as step, index (index)}
					<span
						aria-label={step.title}
						class="dot-indicator"
						class:active={index === stepIndex}
						aria-current={index === stepIndex ? 'step' : undefined}
					></span>
				{/each}
			</div>

			{#if !isFirstStep}
				<div class="footer-actions">
					<Button type="button" variant="ghost" disabled={!canGoBack} onclick={goBack}>
						{t('common.previous')}
					</Button>
				</div>
			{/if}
		</div>
	{/snippet}
</Modal>

<style>
	:global(.onboarding-panel) {
		width: min(520px, calc(100vw - 2 * var(--space-md)));
	}

	@media (max-width: 767px) {
		:global(.onboarding-panel) {
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

		:global(.onboarding-panel .modal-body) {
			flex: 1;
			display: flex;
			flex-direction: column;
		}
	}

	:global(.onboarding-body) {
		padding: var(--space-md) var(--space-lg) 0;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
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

	.step-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		flex: 1;
	}

	.progress-track {
		width: 100%;
		height: 0.35rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: inherit;
		background: var(--color-primary);
		transition: width 0.35s ease;
	}

	.step-body {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: center;
		max-width: 22rem;
		margin-inline: auto;
	}

	.onboarding-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: 0 var(--space-lg) calc(var(--space-lg) + env(safe-area-inset-bottom, 0));
	}

	.step-dots {
		display: flex;
		justify-content: center;
		gap: var(--space-xs);
	}

	.dot-indicator {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-border);
	}

	.dot-indicator.active {
		background: var(--color-primary);
		width: 1.25rem;
	}

	.footer-actions {
		display: flex;
		justify-content: flex-start;
	}
</style>
