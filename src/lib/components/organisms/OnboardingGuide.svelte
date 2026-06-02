<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		ONBOARDING_REPLAY_EVENT,
		ONBOARDING_STEP_COUNT,
		dismissOnboarding,
		getActivationProgress,
		isOnboardingExcludedPath,
		setActivationPath,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';
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
		iconId: FeatureIconId;
	}

	const stepDefinitions: Step[] = [
		{ id: 'welcome', titleKey: 'onboarding.welcome', bodyKey: 'onboarding.welcomeBody', iconId: 'home' },
		{ id: 'scan', titleKey: 'onboarding.scanTitle', bodyKey: 'onboarding.scanBody', iconId: 'barcode' },
		{
			id: 'expiry',
			titleKey: 'onboarding.expiryTitle',
			bodyKey: 'onboarding.expiryBody',
			iconId: 'sparkle'
		},
		{
			id: 'meals',
			titleKey: 'onboarding.mealsTitle',
			bodyKey: 'onboarding.mealsBody',
			iconId: 'box'
		},
		{ id: 'ready', titleKey: 'onboarding.readyTitle', bodyKey: 'onboarding.readyBody', iconId: 'check' }
	];

	let open = $state(false);
	let stepIndex = $state(0);

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
		stepIndex = 0;
		open = true;
	}

	function closeGuide() {
		open = false;
	}

	function skipGuide() {
		dismissOnboarding(userId);
		closeGuide();
	}

	function goNext() {
		if (isLastStep) {
			return;
		}
		stepIndex += 1;
	}

	function goBack() {
		if (isFirstStep) {
			return;
		}
		stepIndex -= 1;
	}

	function finishGuide() {
		dismissOnboarding(userId);
		closeGuide();
	}

	async function chooseReceipt() {
		if (!userId) {
			return;
		}
		setActivationPath('receipt', userId);
		dismissOnboarding(userId);
		closeGuide();
		await goto(`/scan/kvitto?from=${encodeURIComponent(APP_HOME_PATH)}`);
	}

	async function chooseBarcode() {
		if (!userId) {
			return;
		}
		setActivationPath('barcode', userId);
		dismissOnboarding(userId);
		closeGuide();
		await goto(`/scan?mode=barcode&from=${encodeURIComponent(APP_HOME_PATH)}`);
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
</script>

<Modal
	{open}
	onClose={skipGuide}
	variant="sheet"
	dismissible={true}
	panelClass="onboarding-panel"
	bodyClass="onboarding-body"
	label={t('onboarding.dialogAria')}
>
	{#snippet header()}
		<ModalHeader title={currentStep.title} subtitle={currentStep.subtitle}>
			{#snippet actions()}
				<button type="button" class="skip-link" onclick={skipGuide}>
					{t('onboarding.skip')}
				</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div class="step-content">
		{#if encourageCopy}
			<p class="encourage" role="status">{encourageCopy}</p>
		{/if}

		<div class="step-icon" aria-hidden="true">
			<FeatureIcon id={currentStep.iconId} size={32} />
		</div>
		<p class="step-body">{currentStep.body}</p>

		{#if currentStep.id === 'scan'}
			<p class="scan-hint">{t('onboarding.scanHint')}</p>
		{/if}

		{#if currentStep.id === 'ready'}
			{#if activationProgress?.inProgress && activationProgress.path === 'barcode' && activationProgress.barcodeCount > 0}
				<p class="progress-note" role="status">
					{t('onboarding.barcodeProgress', {
						count: activationProgress.barcodeCount,
						goal: activationProgress.barcodeGoal
					})}
				</p>
			{/if}

			<div class="path-actions">
				<Button type="button" fullWidth onclick={chooseReceipt}>
					{t('onboarding.ctaReceipt')}
				</Button>
				<Button type="button" variant="secondary" fullWidth onclick={chooseBarcode}>
					{t('onboarding.ctaBarcode')}
				</Button>
			</div>
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

			<div class="footer-actions">
				<Button type="button" variant="ghost" disabled={!canGoBack} onclick={goBack}>
					{t('common.previous')}
				</Button>
				{#if isLastStep}
					<Button type="button" onclick={finishGuide}>
						{t('onboarding.getStarted')}
					</Button>
				{:else}
					<Button type="button" onclick={goNext}>
						{t('common.next')}
					</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</Modal>

<style>
	:global(.onboarding-panel) {
		width: min(520px, calc(100vw - 2 * var(--space-md)));
	}

	:global(.onboarding-body) {
		padding-top: var(--space-sm);
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
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.encourage {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-align: center;
		line-height: 1.4;
	}

	.step-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
		color: var(--color-primary);
	}

	.step-body {
		margin: 0;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--color-text);
	}

	.scan-hint {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.progress-note {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-align: center;
	}

	.path-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.onboarding-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: 0 var(--space-md) var(--space-md);
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
