<script lang="ts" module>
	/**
	 * Tab-session pause (module scope, same pattern as overlay-stack's session slot):
	 * AppLayout is instantiated per page, so component state would reset on every
	 * navigation and the flow would re-open right after "maybe later" taps.
	 */
	let pausedThisSession = false;
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import ActivationOnboardingScreen from '$lib/components/molecules/ActivationOnboardingScreen.svelte';
	import ActivationFillChips from '$lib/components/molecules/ActivationFillChips.svelte';
	import ActivationFinishRecap from '$lib/components/molecules/ActivationFinishRecap.svelte';
	import OnboardingStepStage from '$lib/components/molecules/OnboardingStepStage.svelte';
	import OnboardingStepDots from '$lib/components/molecules/OnboardingStepDots.svelte';
	import OnboardingLoopProgress from '$lib/components/molecules/OnboardingLoopProgress.svelte';
	import OnboardingCelebrateIllustration from '$lib/components/organisms/OnboardingCelebrateIllustration.svelte';
	import OnboardingLoopIllustration from '$lib/components/organisms/illustrations/OnboardingLoopIllustration.svelte';
	import OnboardingInviteIllustration from '$lib/components/organisms/illustrations/OnboardingInviteIllustration.svelte';
	import OnboardingScanIllustration from '$lib/components/organisms/illustrations/OnboardingScanIllustration.svelte';
	import OnboardingWelcomeIllustration from '$lib/components/organisms/illustrations/OnboardingWelcomeIllustration.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import {
		deriveActivationScreen,
		dismissOnboarding,
		getActivationInviteOutcome,
		getActivationOnboardingFlags,
		getActivationProgressChecklist,
		getActivationSeedSource,
		isActivationOnboardingFlowComplete,
		isOnboardingExcludedPath,
		markActivationFillDeferred,
		markActivationFinishSeen,
		markActivationInviteSeen,
		markActivationScanStarted,
		markActivationStaplesAdded,
		markActivationWelcomeSeen,
		ONBOARDING_PROGRESS_EVENT,
		ONBOARDING_REPLAY_EVENT,
		REGISTRATION_WELCOME_DONE_EVENT,
		secondsSinceSignup,
		shouldShowOnboarding,
		type ActivationScreen
	} from '$lib/utils/onboarding';
	import {
		ACTIVATION_SCREEN_IDS,
		canSelectProgressKey,
		screenIndex
	} from '$lib/utils/onboarding-steps';
	import {
		canClaimSessionOverlay,
		claimSessionOverlay,
		registerBlockingOverlay
	} from '$lib/utils/overlay-stack';
	import { createAndShareHouseholdInvite } from '$lib/utils/household-share-invite';
	import {
		buildStarterPackFormData,
		getOnboardingStaples,
		isStaplePreselected
	} from '$lib/utils/starter-pack-submit';
	import {
		getNotificationPermission,
		isPushSupported,
		subscribeToExpiryPush
	} from '$lib/utils/push-notifications';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';
	import { isReceiptImportToastPending } from '$lib/utils/receipt-import-session';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	let open = $state(false);
	let startedTracked = $state(false);
	let lastViewedStep = $state<string | null>(null);
	let registrationWelcomeDone = $state(false);
	let onboardingProgressTick = $state(0);
	let previewScreen = $state<ActivationScreen | null>(null);
	let exiting = $state(false);

	const staples = getOnboardingStaples();
	let selectedStaples = $state(
		new Set(staples.filter((item) => isStaplePreselected(item.name)).map((item) => item.name))
	);
	let staplesSubmitting = $state(false);

	let inviteSharing = $state(false);
	let inviteCopied = $state(false);
	let inviteError = $state(false);

	let pushEnabled = $state(false);
	let pushPromptTracked = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);
	const inventoryCount = $derived(
		typeof page.data.activeInventoryCount === 'number' ? page.data.activeInventoryCount : 0
	);
	const memberCount = $derived(
		typeof page.data.householdMemberCount === 'number' ? page.data.householdMemberCount : 1
	);
	const flags = $derived.by(() => {
		void onboardingProgressTick;
		return userId ? getActivationOnboardingFlags(userId) : null;
	});
	const flowComplete = $derived.by(() => {
		void onboardingProgressTick;
		return userId ? isActivationOnboardingFlowComplete(userId) : false;
	});
	const derivedScreen = $derived.by((): ActivationScreen | 'complete' => {
		if (!flags) {
			return 'welcome';
		}
		return deriveActivationScreen(flags, inventoryCount, flowComplete, { memberCount });
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
	const displayIndex = $derived(
		displayScreen === 'complete' ? 0 : screenIndex(displayScreen)
	);

	const seeded = $derived(Boolean(flags && (inventoryCount > 0 || flags.staplesAdded || flags.firstScanDone)));
	const seedSource = $derived.by(() => {
		void onboardingProgressTick;
		return userId ? getActivationSeedSource(userId) : null;
	});
	const inviteState = $derived.by((): 'invited' | 'solo' | 'members' => {
		void onboardingProgressTick;
		if (memberCount > 1) {
			return 'members';
		}
		return getActivationInviteOutcome(userId) === 'shared' ? 'invited' : 'solo';
	});

	const pushSupported = $derived(browser && isPushSupported());
	const pushDenied = $derived(browser && getNotificationPermission() === 'denied');
	const showPushBlock = $derived(pushSupported && !pushEnabled && !pushDenied);

	const fillCtaLabel = $derived(
		selectedStaples.size > 0
			? t('onboarding.activation.fill.ctaAdd', { count: selectedStaples.size })
			: t('onboarding.activation.fill.ctaEmpty')
	);

	/* Reflective, data-aware sub-lines: mirror what the user just did/entered so
	   the earlier steps feel as specific as the finish recap. */
	const fillReflectLine = $derived(
		selectedStaples.size > 0
			? t('onboarding.activation.fill.reflectSelected', { count: selectedStaples.size })
			: t('onboarding.activation.fill.reflectEmpty')
	);
	const inviteReflectLine = $derived(
		seeded && inventoryCount > 0
			? t('onboarding.activation.invite.reflectSeeded', { count: inventoryCount })
			: t('onboarding.activation.invite.reflectEmpty')
	);
	const welcomeBody = $derived(
		`${t('onboarding.activation.welcome.body')}\n${t('onboarding.activation.welcome.outcomeLine')}`
	);

	$effect(() => {
		if (!browser) {
			return;
		}
		pushEnabled = getNotificationPermission() === 'granted';
	});

	function clearPreview() {
		previewScreen = null;
	}

	function canSelectDot(index: number): boolean {
		if (!checklist || derivedScreen === 'complete') {
			return false;
		}
		const key = ACTIVATION_SCREEN_IDS[index];
		return canSelectProgressKey(key, checklist, derivedScreen);
	}

	function handleDotSelect(index: number) {
		if (!canSelectDot(index)) {
			return;
		}
		const key = ACTIVATION_SCREEN_IDS[index];
		if (key === derivedScreen) {
			clearPreview();
			return;
		}
		previewScreen = key;
	}

	function tryOpenFlow() {
		if (
			!browser ||
			pausedThisSession ||
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
		if (!canClaimSessionOverlay('onboarding')) {
			open = false;
			return;
		}
		claimSessionOverlay('onboarding');
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
		void trackProductEvent('onboarding_skipped', {
			step: displayScreen === 'complete' ? 'finish' : displayScreen
		});
	}

	function trackStepView(step: ActivationScreen) {
		if (lastViewedStep === step) {
			return;
		}
		lastViewedStep = step;
		void trackProductEvent('onboarding_step_viewed', { step });
	}

	function handleWelcomeContinue() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationWelcomeSeen(userId);
	}

	function toggleStaple(name: string) {
		const next = new Set(selectedStaples);
		if (next.has(name)) {
			next.delete(name);
		} else {
			next.add(name);
		}
		selectedStaples = next;
	}

	const enhanceStarter: SubmitFunction = ({ formData, cancel }) => {
		if (!userId) {
			cancel();
			return;
		}
		if (selectedStaples.size === 0) {
			cancel();
			clearPreview();
			markActivationFillDeferred(userId);
			void trackProductEvent('onboarding_seed_choice', { choice: 'skip', via: 'empty_continue' });
			return;
		}
		const items = staples.filter((item) => selectedStaples.has(item.name));
		const built = buildStarterPackFormData(items, APP_HOME_PATH);
		for (const [key, value] of built.entries()) {
			formData.append(key, value);
		}
		staplesSubmitting = true;
		return async ({ result }) => {
			staplesSubmitting = false;
			if (result.type === 'redirect') {
				clearPreview();
				markActivationStaplesAdded(userId);
				void trackProductEvent('onboarding_seed_choice', {
					choice: 'staples',
					count: items.length
				});
				// Trust over taps: the pantry write must be visible, never silent (locked principle).
				showClientToast(
					t('onboarding.activation.fill.staplesAddedToast', { count: items.length }),
					{ variant: 'success' }
				);
				await invalidateAll();
				return;
			}
			showClientToast(t('common.errorGeneric'), { variant: 'error' });
		};
	};

	function handleFillDeferred() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationFillDeferred(userId);
		void trackProductEvent('onboarding_seed_choice', { choice: 'skip', via: 'kanske_senare' });
		pausedThisSession = true;
		closeFlow();
	}

	async function handleOpenScanner() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationScanStarted(userId);
		void trackProductEvent('onboarding_scan_started');
		void trackProductEvent('onboarding_seed_choice', { choice: 'receipt' });
		closeFlow();
		await goto(receiptOneTapHref(APP_HOME_PATH));
	}

	async function handleInviteShare() {
		if (!userId || inviteSharing) {
			return;
		}
		inviteSharing = true;
		inviteError = false;
		try {
			const outcome = await createAndShareHouseholdInvite({
				context: 'onboarding_v8',
				title: t('household.shareInvite'),
				text: t('household.shareInviteNote')
			});
			if (outcome.status === 'error') {
				inviteError = true;
				return;
			}
			if (outcome.status === 'aborted') {
				return;
			}
			void trackProductEvent('household_invite_prompt_clicked', {
				context: 'onboarding_v8',
				method: outcome.status === 'copied' ? 'copy' : 'share'
			});
			if (outcome.status === 'copied') {
				inviteCopied = true;
			}
			// Kort bekräftelse innan auto-advance så delningen hinner landa visuellt.
			setTimeout(
				() => {
					clearPreview();
					markActivationInviteSeen(userId, 'shared');
				},
				outcome.status === 'copied' ? 1200 : 800
			);
		} catch {
			inviteError = true;
		} finally {
			inviteSharing = false;
		}
	}

	function handleInviteSkip() {
		if (!userId) {
			return;
		}
		clearPreview();
		markActivationInviteSeen(userId, 'skipped');
		void trackProductEvent('household_invite_prompt_dismissed', { context: 'onboarding_v8' });
	}

	async function finishFlow(enablePush: boolean) {
		if (!userId) {
			return;
		}
		clearPreview();
		let pushOutcome = pushEnabled;
		if (enablePush && !pushEnabled) {
			try {
				const result = await subscribeToExpiryPush();
				pushOutcome = result.ok;
				if (!result.ok) {
					showClientToast(t('onboarding.activation.finish.pushOffToast'));
				}
			} catch {
				pushOutcome = false;
				showClientToast(t('onboarding.activation.finish.pushOffToast'));
			}
		}
		markActivationFinishSeen(userId);
		void trackProductEvent('onboarding_completed');
		void trackProductEvent('onboarding_finish_state', {
			seeded,
			invited: inviteState !== 'solo',
			push: pushOutcome,
			seconds_since_signup: secondsSinceSignup(userId)
		});
		exiting = true;
		closeFlow();
		await goto('/inkop?quick=1');
		exiting = false;
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
			pausedThisSession = false;
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
		if (!open || displayScreen !== 'finish' || !showPushBlock || pushPromptTracked) {
			return;
		}
		pushPromptTracked = true;
		void trackProductEvent('onboarding_notifications_prompted');
	});

	$effect(() => {
		if (!open) {
			return;
		}
		return registerBlockingOverlay('onboarding');
	});
</script>

{#if open && displayScreen !== 'complete' && checklist}
	<Modal
		open={true}
		onClose={skipFlow}
		variant="sheet"
		dismissible={false}
		panelClass={`activation-onboarding-panel${exiting ? ' activation-panel-exit' : ''}`}
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
			<OnboardingLoopProgress
				stepIndex={displayIndex}
				stepCount={ACTIVATION_SCREEN_IDS.length}
				complete={displayScreen === 'finish'}
			/>

			<OnboardingStepDots
				keys={ACTIVATION_SCREEN_IDS}
				currentIndex={displayIndex}
				srLabel={t('onboarding.activation.stepOf', {
					current: displayIndex + 1,
					total: ACTIVATION_SCREEN_IDS.length
				})}
				canSelect={canSelectDot}
				onSelect={handleDotSelect}
			/>

			<div class="flow-content">
				<OnboardingStepStage stepIndex={displayIndex}>
					{#if displayScreen === 'welcome'}
						<ActivationOnboardingScreen
							title={t('onboarding.activation.welcome.title')}
							body={welcomeBody}
						>
							{#snippet illustration()}
								<OnboardingLoopIllustration />
							{/snippet}
						</ActivationOnboardingScreen>
					{:else if displayScreen === 'fill'}
						<ActivationOnboardingScreen
							title={t('onboarding.activation.fill.title')}
							body={t('onboarding.activation.fill.body')}
							compact
						>
							{#snippet illustration()}
								{#if selectedStaples.size > 0}
									<OnboardingWelcomeIllustration />
								{:else}
									<OnboardingScanIllustration />
								{/if}
							{/snippet}

							{#snippet extra()}
								<div class="fill-extra">
									<p class="reflect-line" aria-live="polite" data-testid="activation-fill-reflect">
										{fillReflectLine}
									</p>
									<ActivationFillChips
										items={staples}
										selected={selectedStaples}
										onToggle={toggleStaple}
									/>
									<button
										type="button"
										class="receipt-link"
										data-testid="activation-receipt-link"
										onclick={handleOpenScanner}
									>
										{t('onboarding.activation.fill.receiptLink')}
									</button>
								</div>
							{/snippet}
						</ActivationOnboardingScreen>
					{:else if displayScreen === 'invite'}
						<ActivationOnboardingScreen
							title={t('onboarding.activation.invite.title')}
							body={t('onboarding.activation.invite.body')}
						>
							{#snippet illustration()}
								<OnboardingInviteIllustration />
							{/snippet}

							{#snippet extra()}
								<p class="reflect-line" data-testid="activation-invite-reflect">
									{inviteReflectLine}
								</p>
								{#if inviteError}
									<p class="invite-error">{t('onboarding.activation.invite.shareError')}</p>
								{/if}
							{/snippet}
						</ActivationOnboardingScreen>
					{:else}
						<ActivationOnboardingScreen
							title={t('onboarding.activation.finish.title')}
							body={t('onboarding.activation.finish.learningLine')}
							compact
						>
							{#snippet illustration()}
								<div class="finish-stage">
									<OnboardingCelebrateIllustration calm={true} />
								</div>
							{/snippet}

							{#snippet extra()}
								<div class="finish-extra">
									<ActivationFinishRecap
										{seeded}
										{seedSource}
										seedCount={inventoryCount}
										{inviteState}
										{memberCount}
									/>
									{#if showPushBlock}
										<div class="push-block" data-testid="activation-push-block">
											<p class="push-title">{t('onboarding.activation.finish.pushTitle')}</p>
											<p class="push-body">{t('onboarding.activation.finish.pushBody')}</p>
										</div>
									{/if}
								</div>
							{/snippet}
						</ActivationOnboardingScreen>
					{/if}
				</OnboardingStepStage>
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
							{t('onboarding.activation.welcome.cta')}
						</Button>
					{:else if displayScreen === 'fill'}
						<form
							method="POST"
							action="/scan?/bulkCreate"
							class="footer-form"
							use:enhance={enhanceStarter}
						>
							<Button
								type="submit"
								fullWidth
								variant="primary"
								loading={staplesSubmitting}
								data-testid="activation-cta-primary"
							>
								{fillCtaLabel}
							</Button>
						</form>
						<Button
							type="button"
							fullWidth
							variant="ghost"
							data-testid="activation-cta-secondary"
							onclick={handleFillDeferred}
						>
							{t('onboarding.activation.fill.ctaSkip')}
						</Button>
					{:else if displayScreen === 'invite'}
						<Button
							type="button"
							fullWidth
							variant="primary"
							loading={inviteSharing}
							data-testid="activation-cta-primary"
							onclick={handleInviteShare}
						>
							{inviteCopied
								? t('onboarding.activation.invite.copied')
								: t('onboarding.activation.invite.ctaShare')}
						</Button>
						<Button
							type="button"
							fullWidth
							variant="ghost"
							data-testid="activation-cta-secondary"
							onclick={handleInviteSkip}
						>
							{t('onboarding.activation.invite.ctaSkip')}
						</Button>
					{:else if showPushBlock}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={() => finishFlow(true)}
						>
							{t('onboarding.activation.finish.ctaEnable')}
						</Button>
						<Button
							type="button"
							fullWidth
							variant="ghost"
							data-testid="activation-cta-secondary"
							onclick={() => finishFlow(false)}
						>
							{t('onboarding.activation.finish.ctaSkip')}
						</Button>
					{:else}
						<Button
							type="button"
							fullWidth
							variant="primary"
							data-testid="activation-cta-primary"
							onclick={() => finishFlow(false)}
						>
							{t('onboarding.activation.finish.ctaOpen')}
						</Button>
					{/if}
				</div>
			{/key}
		{/snippet}
	</Modal>
{/if}

<style>
	:global(.activation-onboarding-panel) {
		width: min(480px, calc(100vw - 2 * var(--space-md)));
		max-height: min(85vh, 720px);
	}

	:global(.activation-panel-exit) {
		animation: activation-panel-exit 240ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes activation-panel-exit {
		to {
			opacity: 0;
			transform: scale(0.98) translateY(8px);
		}
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

	/* Loop mark sits tight above the step dots — one progress cluster, not two
	   separate rows. */
	.flow-shell :global(.loop-mark) {
		margin-bottom: calc(-1 * var(--space-xs));
	}

	.flow-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.flow-content > :global(.step-stage) {
		flex: 1;
		min-height: 0;
	}

	.flow-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		animation: footer-enter 240ms cubic-bezier(0.33, 1, 0.68, 1) 180ms both;
	}

	.footer-form {
		display: contents;
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

		:global(.activation-panel-exit) {
			animation: none;
		}
	}

	.fill-extra {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.reflect-line {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-primary);
		font-weight: 600;
		text-align: center;
	}

	.receipt-link {
		border: none;
		background: none;
		padding: 0;
		align-self: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
		cursor: pointer;
		min-height: var(--touch-target-min);
	}

	.receipt-link:hover {
		text-decoration: underline;
	}

	.invite-error {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-danger);
		text-align: center;
	}

	.finish-stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.finish-extra {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.push-block {
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	.push-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.push-body {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}
</style>
