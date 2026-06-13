<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { t } from '$lib/i18n';
	import {
		dismissPostOnboardingShare,
		isOnboardingExcludedPath,
		isPostOnboardingSharePath,
		shouldShowOnboarding,
		shouldShowPostOnboardingShare
	} from '$lib/utils/onboarding';

	interface Props {
		memberCount?: number;
		shareLinkEnabled?: boolean;
	}

	let { memberCount = 0, shareLinkEnabled = false }: Props = $props();

	let open = $state(false);
	let sharing = $state(false);
	let copied = $state(false);

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	const shareCtaLabel = $derived(
		shareLinkEnabled ? t('onboarding.sharePromptListaCta') : t('onboarding.sharePromptInviteCta')
	);

	function tryOpenPrompt() {
		if (
			!browser ||
			!userId ||
			memberCount !== 1 ||
			shouldShowOnboarding(userId) ||
			isOnboardingExcludedPath(pathname) ||
			!isPostOnboardingSharePath(pathname) ||
			!shouldShowPostOnboardingShare(userId)
		) {
			open = false;
			return;
		}

		open = true;
	}

	function skipPrompt() {
		dismissPostOnboardingShare(userId);
		open = false;
	}

	async function copyLink(link: string) {
		if (!browser) {
			return;
		}
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	async function shareLink(link: string, title: string, text: string) {
		if (!browser) {
			return;
		}

		if (navigator.share && navigator.canShare?.({ url: link })) {
			try {
				await navigator.share({ title, text, url: link });
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}
			}
		}

		await copyLink(link);
	}

	async function shareListaLink() {
		const response = await fetch('/api/shopping-list/share', { method: 'POST' });
		const body = (await response.json().catch(() => ({}))) as {
			ok?: boolean;
			url?: string;
			error?: string;
		};

		if (!response.ok || !body.ok || !body.url) {
			showClientToast(body.error ?? t('shoppingListShare.shareLinkError'), { variant: 'error' });
			return false;
		}

		await shareLink(
			body.url,
			t('shoppingListShare.shareLinkTitle'),
			t('shoppingListShare.shareLinkNote')
		);
		return true;
	}

	async function shareHouseholdInvite() {
		const response = await fetch('/api/household/share-invite', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ context: 'onboarding' })
		});
		const body = (await response.json().catch(() => ({}))) as {
			ok?: boolean;
			inviteUrl?: string;
		};

		if (!response.ok || !body.ok || !body.inviteUrl) {
			return false;
		}

		await shareLink(body.inviteUrl, t('household.shareInvite'), t('household.shareInviteNote'));
		return true;
	}

	async function shareWithPartner() {
		if (!browser || sharing) {
			return;
		}

		sharing = true;
		try {
			const shared = shareLinkEnabled ? await shareListaLink() : await shareHouseholdInvite();
			if (shared) {
				dismissPostOnboardingShare(userId);
				open = false;
			}
		} finally {
			sharing = false;
		}
	}

	function goToShoppingList() {
		dismissPostOnboardingShare(userId);
		open = false;
		void goto('/inkop');
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		void memberCount;
		void shareLinkEnabled;
		tryOpenPrompt();
	});
</script>

<Modal
	{open}
	onClose={skipPrompt}
	variant="sheet"
	dismissible={true}
	panelClass="post-onboarding-share-panel"
	label={t('onboarding.sharePromptAria')}
>
	{#snippet header()}
		<ModalHeader title={t('onboarding.sharePromptTitle')}>
			{#snippet actions()}
				<button
					type="button"
					class="skip-link"
					data-testid="post-onboarding-share-skip"
					onclick={skipPrompt}
				>
					{t('onboarding.sharePromptSkip')}
				</button>
			{/snippet}
		</ModalHeader>
	{/snippet}

	<div class="share-body" aria-busy={sharing}>
		<p class="lead">{t('onboarding.sharePromptBody')}</p>
		<div class="share-actions">
			<Button
				type="button"
				fullWidth
				disabled={sharing}
				data-testid="post-onboarding-share-cta"
				onclick={shareWithPartner}
			>
				{sharing ? t('common.loading') : copied ? t('common.copied') : shareCtaLabel}
			</Button>
			<Button type="button" variant="secondary" fullWidth onclick={goToShoppingList}>
				{t('onboarding.sharePromptInkopCta')}
			</Button>
			<Button type="button" variant="ghost" onclick={skipPrompt}>
				{t('onboarding.sharePromptSkip')}
			</Button>
		</div>
	</div>
</Modal>

<style>
	.skip-link {
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.share-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.lead {
		margin: 0;
		font-size: 0.95rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.share-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
