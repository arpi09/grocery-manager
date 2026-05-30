<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { LOCATION_COLORS } from '$lib/domain/location';
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
		icon: string;
		highlight?: 'locations' | 'scan';
	}

	const steps: Step[] = [
		{
			title: 'Välkommen till Home Pantry',
			subtitle: 'Steg 1 av 5',
			body: 'Håll koll på vad du har hemma — i kyl, frys och skafferi. Se vad som snart går ut och slipp dubbelköp.',
			icon: '🏠'
		},
		{
			title: 'Skanna varor',
			subtitle: 'Steg 2 av 5',
			body: 'Skanna streckkoder med kameran för att lägga till varor på några sekunder. Du hittar skanna-knappen längst ner på mobilen.',
			icon: '📷',
			highlight: 'scan'
		},
		{
			title: 'Tre platser',
			subtitle: 'Steg 3 av 5',
			body: 'Dela upp lagret efter var varorna står. Tryck på en plats på startsidan för att se och redigera innehållet.',
			icon: '🫙',
			highlight: 'locations'
		},
		{
			title: 'Dela hushåll',
			subtitle: 'Steg 4 av 5',
			body: 'Bjud in familj eller sambo under Inställningar. Byt mellan hushåll via menyn högst upp om du har flera skafferier.',
			icon: '👥'
		},
		{
			title: 'Du är redo!',
			subtitle: 'Steg 5 av 5',
			body: 'Börja med att skanna några varor eller lägg till manuellt. Guiden visas bara en gång — du kan alltid öppna den igen under Inställningar.',
			icon: '✅'
		}
	];

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

		pathname;
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
				<button type="button" class="skip-link" onclick={skipGuide}>Hoppa över</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div class="step-content">
		<div class="step-icon" aria-hidden="true">{currentStep.icon}</div>
		<p class="step-body">{currentStep.body}</p>

		{#if currentStep.highlight === 'locations'}
			<ul class="location-preview" aria-label="Lagringsplatser">
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.fridge}"></span>
					Kyl
				</li>
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.freezer}"></span>
					Frys
				</li>
				<li>
					<span class="dot" style="background: {LOCATION_COLORS.cupboard}"></span>
					Skafferi
				</li>
			</ul>
		{/if}

		{#if currentStep.highlight === 'scan'}
			<Button type="button" variant="secondary" fullWidth onclick={tryScan}>
				Prova skanna
			</Button>
		{/if}
	</div>

	{#snippet footer()}
		<div class="onboarding-footer">
			<div class="step-dots" role="tablist" aria-label="Introduktionssteg">
				{#each steps as _, index (index)}
					<span
						class="dot-indicator"
						class:active={index === stepIndex}
						aria-current={index === stepIndex ? 'step' : undefined}
					></span>
				{/each}
			</div>

			<div class="footer-actions">
				<Button type="button" variant="ghost" disabled={isFirstStep} onclick={goBack}>
					Tillbaka
				</Button>
				<Button type="button" onclick={goNext}>
					{isLastStep ? 'Kom igång' : 'Nästa'}
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
		font-size: 2.5rem;
		line-height: 1;
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
