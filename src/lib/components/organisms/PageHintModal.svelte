<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		dismissPageHint,
		markPageHintShownInSession,
		resolvePageHintId,
		shouldShowPageHint,
		type PageHintId
	} from '$lib/utils/page-hints';
	import {
		isOnboardingExcludedPath,
		shouldShowCelebration,
		shouldShowOnboarding
	} from '$lib/utils/onboarding';

	let open = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);
	const hintId = $derived(resolvePageHintId(pathname));

	const titleKey = $derived(
		hintId ? (`pageHints.${hintId}.title` as MessageKey) : ('pageHints.hem.title' as MessageKey)
	);
	const bodyKey = $derived(
		hintId ? (`pageHints.${hintId}.body` as MessageKey) : ('pageHints.hem.body' as MessageKey)
	);

	function tryOpenHint() {
		const currentHint = hintId;
		if (
			!browser ||
			!currentHint ||
			!userId ||
			isOnboardingExcludedPath(pathname) ||
			shouldShowOnboarding(userId) ||
			shouldShowCelebration(userId) ||
			!shouldShowPageHint(currentHint, userId)
		) {
			open = false;
			return;
		}
		markPageHintShownInSession(currentHint, userId);
		open = true;
	}

	function dismissHint() {
		const currentHint = hintId;
		if (currentHint) {
			dismissPageHint(currentHint as PageHintId, userId);
		}
		open = false;
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		tryOpenHint();
	});
</script>

{#if open && hintId}
	<div
		class="page-hint-banner page-hint-panel"
		role="dialog"
		aria-label={t('pageHints.dialogAria')}
		data-testid="page-hint-banner"
	>
		<div class="hint-content">
			<p class="hint-title">{t(titleKey)}</p>
			<p class="hint-body">{t(bodyKey)}</p>
		</div>
		<Button type="button" data-testid="page-hint-dismiss" onclick={dismissHint}>
			{t('pageHints.gotIt')}
		</Button>
	</div>
{/if}

<style>
	.page-hint-banner {
		position: fixed;
		z-index: calc(var(--z-modal) - 2);
		left: var(--space-md);
		right: var(--space-md);
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-surface) 96%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		box-shadow: var(--shadow-md);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		pointer-events: auto;
		animation: hint-banner-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (min-width: 640px) {
		.page-hint-banner {
			left: auto;
			right: var(--space-lg);
			max-width: min(24rem, calc(100vw - 2 * var(--space-lg)));
		}
	}

	.hint-content {
		flex: 1 1 12rem;
		min-width: 0;
	}

	.hint-title {
		margin: 0;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.hint-body {
		margin: 0.25rem 0 0;
		font-size: var(--font-size-body-sm);
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	@keyframes hint-banner-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.page-hint-banner {
			animation: none;
		}
	}
</style>
