<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import { scanModeHref } from '$lib/utils/scan-nav';
	import {
		clearCelebrationPending,
		getActivationProgress,
		isOnboardingExcludedPath,
		shouldShowCelebration
	} from '$lib/utils/onboarding';

	let open = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	function tryOpenCelebration() {
		if (!browser || !userId || isOnboardingExcludedPath(pathname) || !shouldShowCelebration(userId)) {
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

	async function goScan() {
		closeCelebration();
		const progress = getActivationProgress(userId);
		const mode = progress.path === 'receipt' ? 'receipt' : 'barcode';
		await goto(scanModeHref(mode, APP_HOME_PATH));
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenCelebration();
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
		<div class="celebration-icon motion-fade-in" aria-hidden="true">
			<FeatureIcon id="check" size={32} />
		</div>
		<p class="celebrate-lead">{t('onboarding.celebrateBody')}</p>
		<div class="celebration-actions">
			<Button type="button" fullWidth onclick={goScan}>
				{t('onboarding.celebrateCtaScan')}
			</Button>
		</div>
		<button type="button" class="dismiss-link" onclick={goHome}>
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
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		text-align: center;
		box-sizing: border-box;
	}

	.celebration-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-success) 14%, var(--color-surface-muted));
		color: var(--color-success);
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
