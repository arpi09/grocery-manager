<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import {
		canTriggerInstallPrompt,
		initPwaInstallListeners,
		isAndroidDevice,
		isIosDevice,
		isStandaloneDisplay,
		shouldOfferInstallExperience,
		subscribeInstallPrompt,
		triggerInstallPrompt
	} from '$lib/utils/pwa';

	interface Props {
		/** Hide platform steps when already running as installed PWA */
		hideWhenInstalled?: boolean;
	}

	let { hideWhenInstalled = true }: Props = $props();

	let canInstall = $state(false);
	let installBusy = $state(false);
	let installMessage = $state<string | null>(null);

	const installed = $derived(isStandaloneDisplay());
	const showGuide = $derived(!hideWhenInstalled || !installed);
	const showIos = $derived(shouldOfferInstallExperience() && isIosDevice());
	const showAndroid = $derived(shouldOfferInstallExperience() && isAndroidDevice());
	const showDesktopNote = $derived(!isIosDevice() && !isAndroidDevice());

	function refreshInstallState() {
		canInstall = canTriggerInstallPrompt();
	}

	onMount(() => {
		initPwaInstallListeners();
		refreshInstallState();
		return subscribeInstallPrompt(refreshInstallState);
	});

	async function handleInstallClick() {
		installBusy = true;
		installMessage = null;
		const outcome = await triggerInstallPrompt();
		installBusy = false;
		if (outcome === 'accepted') {
			installMessage = t('pwa.install.accepted');
		} else if (outcome === 'dismissed') {
			installMessage = t('pwa.install.dismissed');
		}
		refreshInstallState();
	}
</script>

{#if showGuide}
	<section class="install-guide" aria-labelledby="install-guide-title">
		<h2 id="install-guide-title" class="guide-title">{t('pwa.guide.title')}</h2>
		<p class="guide-lead">{t('pwa.guide.lead')}</p>

		{#if installed}
			<p class="installed-note" role="status">{t('pwa.guide.alreadyInstalled')}</p>
		{:else}
			{#if canInstall}
				<div class="install-cta">
					<Button
						type="button"
						variant="primary"
						loading={installBusy}
						loadingLabel={t('common.loading')}
						onclick={handleInstallClick}
					>
						{t('pwa.install.cta')}
					</Button>
					{#if installMessage}
						<p class="install-feedback" role="status">{installMessage}</p>
					{/if}
				</div>
			{/if}

			{#if showIos}
				<div class="platform-block">
					<h3>{t('pwa.guide.iosTitle')}</h3>
					<ol>
						<li>{t('pwa.guide.iosStep1')}</li>
						<li>{t('pwa.guide.iosStep2')}</li>
						<li>{t('pwa.guide.iosStep3')}</li>
					</ol>
					<p class="platform-hint">{t('pwa.guide.iosHint')}</p>
				</div>
			{/if}

			{#if showAndroid}
				<div class="platform-block">
					<h3>{t('pwa.guide.androidTitle')}</h3>
					<ol>
						<li>{t('pwa.guide.androidStep1')}</li>
						<li>{t('pwa.guide.androidStep2')}</li>
						<li>{t('pwa.guide.androidStep3')}</li>
					</ol>
					{#if !canInstall}
						<p class="platform-hint">{t('pwa.guide.androidHint')}</p>
					{/if}
				</div>
			{/if}

			{#if showDesktopNote}
				<p class="desktop-note">{t('pwa.guide.desktopNote')}</p>
			{/if}
		{/if}
	</section>
{/if}

<style>
	.install-guide {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.guide-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.guide-lead {
		margin: 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.installed-note,
	.desktop-note,
	.platform-hint,
	.install-feedback {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.install-cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-sm);
	}

	.platform-block h3 {
		margin: 0 0 var(--space-sm);
		font-size: 1rem;
		font-weight: 600;
	}

	.platform-block ol {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		line-height: var(--line-height-body);
	}
</style>
