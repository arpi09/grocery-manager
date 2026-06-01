<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import { t } from '$lib/i18n';
	import {
		clearCelebrationPending,
		getActivationProgress,
		isOnboardingExcludedPath,
		shouldShowCelebration
	} from '$lib/utils/onboarding';

	let open = $state(false);

	const pathname = $derived(page.url.pathname);
	const fromHome = $derived(encodeURIComponent(APP_HOME_PATH));

	function tryOpenCelebration() {
		if (!browser || isOnboardingExcludedPath(pathname) || !shouldShowCelebration()) {
			open = false;
			return;
		}
		open = true;
	}

	function closeCelebration() {
		clearCelebrationPending();
		open = false;
	}

	async function goScan() {
		closeCelebration();
		const path = getActivationProgress().path === 'receipt' ? '/scan/kvitto' : '/scan';
		const query =
			getActivationProgress().path === 'receipt'
				? `?from=${fromHome}`
				: `?mode=barcode&from=${fromHome}`;
		await goto(`${path}${query}`);
	}

	async function goShopping() {
		closeCelebration();
		await goto('/inkop');
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		tryOpenCelebration();
	});
</script>

<Modal
	{open}
	onClose={closeCelebration}
	variant="center"
	dismissible={true}
	panelClass="celebration-panel"
	title={t('onboarding.celebrateTitle')}
>
	<div class="celebration-body">
		<div class="celebration-icon" aria-hidden="true">
			<FeatureIcon id="check" size={36} />
		</div>
		<p>{t('onboarding.celebrateBody')}</p>
		<div class="celebration-actions">
			<Button type="button" fullWidth onclick={goScan}>
				{t('onboarding.celebrateCtaScan')}
			</Button>
			<Button type="button" variant="secondary" fullWidth onclick={goShopping}>
				{t('onboarding.celebrateCtaShopping')}
			</Button>
		</div>
		<button type="button" class="dismiss-link" onclick={closeCelebration}>
			{t('onboarding.celebrateDismiss')}
		</button>
	</div>
</Modal>

<style>
	:global(.celebration-panel) {
		width: min(400px, calc(100vw - 2 * var(--space-md)));
	}

	.celebration-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md) var(--space-md);
		text-align: center;
	}

	.celebration-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
	}

	.celebration-body p {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		max-width: 32ch;
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
