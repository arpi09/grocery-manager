<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import CelebrationBurst from '$lib/components/atoms/CelebrationBurst.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import OnboardingCelebrateIllustration from '$lib/components/organisms/OnboardingCelebrateIllustration.svelte';
	import OnboardingStepIllustration from '$lib/components/organisms/OnboardingStepIllustration.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		ONBOARDING_PROGRESS_EVENT,
		ONBOARDING_REPLAY_EVENT,
		ONBOARDING_STEP_COUNT,
		REGISTRATION_WELCOME_DONE_EVENT,
		clearCelebrationPending,
		completeOnboarding,
		dismissOnboarding,
		getActivationProgress,
		isActivationComplete,
		isOnboardingExcludedPath,
		setActivationPath,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';
	import {
		canGoBackOnboarding,
		getEncourageKeyForStepIndex,
		isLastOnboardingStep,
		type OnboardingEncourageKey,
		type OnboardingStepId
	} from '$lib/utils/onboarding-steps';

	interface Step {
		id: OnboardingStepId;
		titleKey: MessageKey;
		bodyKey: MessageKey;
	}

	const stepDefinitions: Step[] = [
		{
			id: 'welcome',
			titleKey: 'onboarding.welcome',
			bodyKey: 'onboarding.welcomeBodyShoppingList'
		},
		{
			id: 'addItems',
			titleKey: 'onboarding.addItemsTitle',
			bodyKey: 'onboarding.addItemsBodyShoppingList'
		},
		{
			id: 'celebrate',
			titleKey: 'onboarding.celebrateTitle',
			bodyKey: 'onboarding.celebrateStartedBody'
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
	const encourageKey = $derived(getEncourageKeyForStepIndex(stepIndex));
	const encourageCopy = $derived(
		encourageKey ? t(`onboarding.${encourageKey}` as `onboarding.${OnboardingEncourageKey}`) : null
	);
	const activationProgress = $derived(browser && userId ? getActivationProgress(userId) : null);
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
		if (!userId) {
			return;
		}
		dismissOnboarding(userId);
		closeGuide();
		void trackProductEvent('onboarding_skipped');
	}

	function goNext() {
		if (isLastStep) {
			return;
		}
		stepDirection = 'forward';
		stepIndex += 1;
	}

	function goBack() {
		if (isFirstStep) {
			return;
		}
		stepDirection = 'back';
		stepIndex -= 1;
	}

	function finishGuide() {
		if (!userId) {
			return;
		}
		clearCelebrationPending(userId);
		completeOnboarding(userId);
		closeGuide();
		void goto(APP_HOME_PATH);
	}

	async function beginAddingToList() {
		if (userId) {
			setActivationPath('shopping', userId);
		}
		closeGuide();
		await goto('/inkop');
	}

	function syncCelebrateStep() {
		if (!open || !userId || !isActivationComplete(userId) || stepIndex >= 2) {
			return;
		}
		stepDirection = 'forward';
		stepIndex = 2;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenGuide();
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const onReplay = () => {
			if (!userId || isOnboardingExcludedPath(pathname)) {
				return;
			}
			stepIndex = 0;
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
			tryOpenGuide();
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
			tryOpenGuide();
		}
	});

	$effect(() => {
		if (!browser || !open || !userId) {
			return;
		}

		syncCelebrateStep();

		const onProgress = () => syncCelebrateStep();
		window.addEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
		return () => window.removeEventListener(ONBOARDING_PROGRESS_EVENT, onProgress);
	});

	$effect(() => {
		if (!open) {
			return;
		}
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
		<ModalHeader title={currentStep.title} subtitle={currentStep.subtitle}>
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

		{#if encourageCopy}
			<p class="encourage" role="status">{encourageCopy}</p>
		{/if}

		<div class="illustration-wrap">
			<CelebrationBurst active={open && currentStep.id === 'celebrate'} />
			{#if currentStep.id === 'celebrate'}
				<OnboardingCelebrateIllustration heavy />
			{:else}
				<OnboardingStepIllustration step={currentStep.id} />
			{/if}
		</div>

		<p class="step-body">{currentStep.body}</p>

		{#if currentStep.id === 'addItems'}
			<p class="scan-tab-hint">{t('onboarding.shoppingListInviteHint')}</p>
			{#if activationProgress?.inProgress && activationProgress.path === 'shopping' && activationProgress.shoppingListCount > 0}
				<p class="progress-note" role="status">
					{t('onboarding.shoppingListProgress', {
						count: activationProgress.shoppingListCount,
						goal: activationProgress.shoppingListGoal
					})}
				</p>
			{/if}

			<div class="activation-choices">
				<Button
					type="button"
					fullWidth
					data-testid="onboarding-start-shopping-list"
					data-analytics-id="onboarding.start_shopping_list"
					onclick={beginAddingToList}
				>
					{t('onboarding.startShoppingList')}
				</Button>
			</div>
		{/if}

		{#if currentStep.id === 'celebrate'}
			<Button type="button" fullWidth data-testid="onboarding-finish" data-analytics-id="onboarding.finish" onclick={finishGuide}>
				{t('onboarding.startUsingApp')}
			</Button>
		{/if}
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

			{#if !isLastStep}
				<div class="footer-actions">
					<Button type="button" variant="ghost" disabled={!canGoBack} onclick={goBack}>
						{t('common.previous')}
					</Button>
					<Button type="button" onclick={goNext}>
						{t('common.next')}
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
			animation: onboarding-fullscreen-in 0.32s ease-out;
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

	@keyframes onboarding-fullscreen-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

	.skip-link:hover {
		color: var(--color-text);
	}

	.step-content {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		flex: 1;
		animation: step-enter 0.35s ease-out;
	}

	.step-content.step-forward {
		animation-name: step-enter-forward;
	}

	.step-content.step-back {
		animation-name: step-enter-back;
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
		background: linear-gradient(
			90deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 70%, #7dd3fc)
		);
		transition: width 0.35s ease;
	}

	.illustration-wrap {
		position: relative;
	}

	@keyframes step-enter-forward {
		from {
			opacity: 0;
			transform: translateX(1.25rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes step-enter-back {
		from {
			opacity: 0;
			transform: translateX(-1.25rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes step-enter {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.step-content,
		:global(.onboarding-panel) {
			animation: none;
		}

		.progress-fill {
			transition: none;
		}
	}

	.encourage {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-align: center;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.step-body {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		text-align: center;
		max-width: 22rem;
		margin-inline: auto;
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.activation-choices {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
	}

	.progress-note,
	.scan-tab-hint {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-align: center;
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
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	@media (min-width: 480px) {
		.footer-actions {
			display: flex;
			justify-content: space-between;
		}

		.footer-actions :global(.btn) {
			min-width: 7.5rem;
		}
	}
</style>
