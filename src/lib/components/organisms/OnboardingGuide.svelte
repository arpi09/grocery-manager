<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { LOCATION_COLORS } from '$lib/domain/location';
	import { t } from '$lib/i18n';
	import {
		ONBOARDING_REPLAY_EVENT,
		dismissOnboarding,
		isOnboardingExcludedPath,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';

	interface Step {
		title: string;
		subtitle: string;
		body: string;
		iconId: FeatureIconId;
		highlight?: 'locations' | 'scan';
	}

	const steps = $derived<Step[]>([
		{
			title: t('onboarding.welcome'),
			subtitle: t('onboarding.stepOf', { current: 1, total: 5 }),
			body: t('onboarding.welcomeBody'),
			iconId: 'home'
		},
		{
			title: t('onboarding.scanTitle'),
			subtitle: t('onboarding.stepOf', { current: 2, total: 5 }),
			body: t('onboarding.scanBody'),
			iconId: 'barcode',
			highlight: 'scan'
		},
		{
			title: t('onboarding.locationsTitle'),
			subtitle: t('onboarding.stepOf', { current: 3, total: 5 }),
			body: t('onboarding.locationsBody'),
			iconId: 'cupboard',
			highlight: 'locations'
		},
		{
			title: t('onboarding.shareTitle'),
			subtitle: t('onboarding.stepOf', { current: 4, total: 5 }),
			body: t('onboarding.shareBody'),
			iconId: 'users'
		},
		{
			title: t('onboarding.readyTitle'),
			subtitle: t('onboarding.stepOf', { current: 5, total: 5 }),
			body: t('onboarding.readyBody'),
			iconId: 'check'
		}
	]);

	let open = $state(false);
	let stepIndex = $state(0);

	const pathname = $derived(page.url.pathname);
	const currentStep = $derived(steps[stepIndex]);
	const isFirstStep = $derived(stepIndex === 0);
	const isLastStep = $derived(stepIndex === steps.length - 1);

	function tryOpenGuide() {
		if (!browser || isOnboardingExcludedPath(pathname) || !shouldShowOnboarding()) {
			return;
		}
		stepIndex = 0;
		open = true;
	}

	function closeGuide() {
		open = false;
	}

	function skipGuide() {
		dismissOnboarding();
		closeGuide();
	}

	function finishGuide() {
		dismissOnboarding();
		closeGuide();
	}

	function goNext() {
		if (isLastStep) {
			finishGuide();
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

	async function tryScan() {
		dismissOnboarding();
		closeGuide();
		await goto('/scan?from=%2F');
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		tryOpenGuide();
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const onReplay = () => {
			if (isOnboardingExcludedPath(pathname)) {
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
>
	{#snippet header()}
		<ModalHeader title={currentStep.title} subtitle={currentStep.subtitle}>
			{#snippet actions()}
				<button type="button" class="skip-link" onclick={skipGuide}>{t('common.skip')}</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div class="step-content">
		<div class="step-icon" aria-hidden="true">
			<FeatureIcon id={currentStep.iconId} size={32} />
		</div>
		<p class="step-body">{currentStep.body}</p>

		{#if currentStep.highlight === 'locations'}
			<ul class="location-preview" aria-label={t('onboarding.locationsAria')}>
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.fridge}"></span>
					{t('onboarding.fridgeShort')}
				</li>
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.freezer}"></span>
					{t('onboarding.freezerShort')}
				</li>
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.cupboard}"></span>
					{t('onboarding.cupboardShort')}
				</li>
			</ul>
		{/if}

		{#if currentStep.highlight === 'scan'}
			<Button type="button" variant="secondary" fullWidth onclick={tryScan}>
				{t('onboarding.tryScan')}
			</Button>
		{/if}
	</div>

	{#snippet footer()}
		<div class="onboarding-footer">
			<div class="step-dots" role="tablist" aria-label={t('onboarding.stepsAria')}>
				{#each steps as step, index (index)}
					<span
						aria-label={step.title} class="dot-indicator"
						class:active={index === stepIndex}
						aria-current={index === stepIndex ? 'step' : undefined}
					></span>
				{/each}
			</div>

			<div class="footer-actions">
				<Button type="button" variant="ghost" disabled={isFirstStep} onclick={goBack}>
					{t('common.previous')}
				</Button>
				<Button type="button" onclick={goNext}>
					{isLastStep ? t('common.getStarted') : t('common.next')}
				</Button>
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

	.location-preview {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-sm);
	}

	.location-preview li {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		font-weight: 600;
	}

	.dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 999px;
		flex-shrink: 0;
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
