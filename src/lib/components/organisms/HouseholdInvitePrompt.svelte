<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import { getSignupAt, isOnboardingExcludedPath } from '$lib/utils/onboarding';
	import { registerBlockingOverlay } from '$lib/utils/overlay-stack';
	import {
		dismissHouseholdInvitePrompt,
		getGlobalHouseholdInvitePromptContext,
		shouldShowHouseholdInvitePrompt,
		shouldShowInkopHouseholdInvitePrompt,
		type HouseholdInvitePromptContext
	} from '$lib/utils/household-invite-prompt';

	interface Props {
		memberCount?: number;
	}

	let { memberCount = 0 }: Props = $props();

	let open = $state(false);
	let shownEventSent = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);
	const promptContext = $derived(
		userId ? getGlobalHouseholdInvitePromptContext(userId) : ('settings' as HouseholdInvitePromptContext)
	);
	const promptBody = $derived(
		promptContext === 'export_prompt'
			? t('householdInvite.promptExportBody')
			: t('householdInvite.promptBody')
	);

	function tryOpen() {
		if (!browser || !userId || isOnboardingExcludedPath(pathname)) {
			open = false;
			return;
		}

		if (pathname === '/inkop') {
			const uncheckedCount = Array.isArray(page.data.items) ? page.data.items.length : 0;
			const checkedCount =
				typeof page.data.checkedCount === 'number' ? page.data.checkedCount : 0;
			const listHasItems = uncheckedCount > 0 || checkedCount > 0;

			if (
				shouldShowInkopHouseholdInvitePrompt({
					userId,
					memberCount,
					listHasItems,
					uncheckedCount,
					checkedCount
				})
			) {
				open = false;
				return;
			}
		}

		const calmPath =
			pathname === '/hem' ||
			pathname === '/inkop' ||
			pathname.startsWith('/inventory/') ||
			pathname.startsWith('/planer');

		if (!calmPath) {
			open = false;
			return;
		}

		open = shouldShowHouseholdInvitePrompt({
			userId,
			memberCount,
			signupAt: getSignupAt(userId)
		});
	}

	function dismiss() {
		void trackProductEvent('household_invite_prompt_dismissed', { context: promptContext });
		dismissHouseholdInvitePrompt(userId);
		open = false;
	}

	function handleCtaClick() {
		void trackProductEvent('household_invite_prompt_clicked', { context: promptContext });
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		void memberCount;
		tryOpen();
	});

	$effect(() => {
		if (!open) {
			shownEventSent = false;
			return;
		}
		return registerBlockingOverlay();
	});

	$effect(() => {
		if (!open || !userId || shownEventSent) {
			return;
		}

		void trackProductEvent('household_invite_prompt_shown', { context: promptContext });
		shownEventSent = true;
	});
</script>

<Modal
	{open}
	onClose={dismiss}
	variant="center"
	dismissible={true}
	title={t('householdInvite.promptTitle')}
	label={t('householdInvite.promptAria')}
	panelClass="household-invite-panel"
>
	<div class="invite-body">
		<p class="invite-lead">{promptBody}</p>
		<div class="invite-actions">
			<a
				class="invite-cta"
				href="/settings#household"
				data-analytics-id="household_invite.prompt_cta"
				onclick={handleCtaClick}
			>
				{t('householdInvite.promptCta')}
			</a>
			<Button type="button" variant="ghost" onclick={dismiss}>
				{t('householdInvite.promptDismiss')}
			</Button>
		</div>
	</div>
</Modal>

<style>
	:global(.household-invite-panel) {
		width: min(400px, calc(100vw - 2 * var(--space-md)));
	}

	.invite-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		padding: var(--space-md) var(--space-lg) var(--space-xl);
	}

	.invite-lead {
		margin: 0;
		font-size: 1rem;
		line-height: 1.55;
		color: var(--color-text-muted);
		text-align: center;
	}

	.invite-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.invite-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.invite-cta:hover {
		background: var(--color-primary-hover);
		text-decoration: none;
	}
</style>
