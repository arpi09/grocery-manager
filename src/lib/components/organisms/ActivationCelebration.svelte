<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { t } from '$lib/i18n';
	import {
		clearCelebrationPending,
		isOnboardingExcludedPath,
		shouldShowCelebration
	} from '$lib/utils/onboarding';

	let open = $state(false);

	const pathname = $derived(page.url.pathname);

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

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		tryOpenCelebration();
	});

	$effect(() => {
		if (!browser || !open) {
			return;
		}

		const timer = window.setTimeout(closeCelebration, 4000);
		return () => window.clearTimeout(timer);
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
		<Button type="button" fullWidth onclick={closeCelebration}>
			{t('onboarding.celebrateCta')}
		</Button>
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
		max-width: 28ch;
	}
</style>
