<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import CelebrationBurst from '$lib/components/atoms/CelebrationBurst.svelte';
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
	const userId = $derived(page.data.user?.id ?? null);
	const fromHome = $derived(encodeURIComponent(APP_HOME_PATH));

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

	async function goScan() {
		closeCelebration();
		const path =
			getActivationProgress(userId).path === 'receipt' ? '/scan?mode=receipt' : '/scan';
		const query =
			getActivationProgress(userId).path === 'receipt'
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
		void userId;
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
		<CelebrationBurst active={open} />
		<div class="celebration-icon motion-fade-in" aria-hidden="true">
			<FeatureIcon id="sparkle" size={36} />
		</div>
		<p class="celebrate-woohoo">{t('onboarding.celebrateWoohoo')}</p>
		<p class="celebrate-sub">{t('onboarding.celebrateBody')}</p>
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
		max-height: min(90dvh, 32rem);
	}

	:global(.celebration-panel .modal-body) {
		overflow-y: auto;
	}

	.celebration-body {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		text-align: center;
		overflow: hidden;
		box-sizing: border-box;
	}

	.celebration-icon {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted));
		color: var(--color-primary);
		box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary) 8%, transparent);
		animation: celebrate-icon-glow 2s ease-in-out infinite;
	}

	@keyframes celebrate-icon-glow {
		0%,
		100% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--color-primary) 8%, transparent);
		}
		50% {
			box-shadow: 0 0 0 10px color-mix(in srgb, var(--color-primary) 4%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebration-icon {
			animation: none;
		}
	}

	.celebrate-woohoo {
		position: relative;
		z-index: 1;
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		line-height: 1.35;
		color: var(--color-text);
		max-width: 100%;
		padding: 0 var(--space-xs);
		overflow-wrap: anywhere;
		animation: celebrate-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
	}

	.celebrate-sub {
		position: relative;
		z-index: 1;
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		max-width: 100%;
		padding: 0 var(--space-xs);
		overflow-wrap: anywhere;
	}

	@keyframes celebrate-pop {
		from {
			opacity: 0;
			transform: scale(0.92) translateY(0.35rem);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebrate-woohoo {
			animation: none;
		}
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
