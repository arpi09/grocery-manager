<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		dismissPageHint,
		resolvePageHintId,
		shouldShowPageHint,
		type PageHintId
	} from '$lib/utils/page-hints';
	import { isOnboardingExcludedPath, shouldShowOnboarding } from '$lib/utils/onboarding';

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
			!shouldShowPageHint(currentHint, userId)
		) {
			open = false;
			return;
		}
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

<Modal
	{open}
	onClose={dismissHint}
	variant="center"
	dismissible={true}
	panelClass="page-hint-panel"
	title={hintId ? t(titleKey) : ''}
	label={t('pageHints.dialogAria')}
>
	<p class="hint-body">{hintId ? t(bodyKey) : ''}</p>
	<Button type="button" fullWidth data-testid="page-hint-dismiss" onclick={dismissHint}>
		{t('pageHints.gotIt')}
	</Button>
</Modal>

<style>
	:global(.page-hint-panel) {
		width: min(380px, calc(100vw - 2 * var(--space-md)));
	}

	.hint-body {
		margin: 0 0 var(--space-lg);
		font-size: 1rem;
		line-height: 1.55;
		color: var(--color-text-muted);
	}
</style>
