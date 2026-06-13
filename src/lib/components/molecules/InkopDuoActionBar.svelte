<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/atoms/Button.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		fetchHouseholdInviteUrl,
		fetchShoppingListShareUrl,
		shareHouseholdInviteUrl,
		shareShoppingListUrl
	} from '$lib/utils/inkop-duo-actions';

	interface Props {
		shareLinkEnabled?: boolean;
		memberCount?: number;
		canEdit?: boolean;
		uncheckedCount?: number;
		checkedCount?: number;
	}

	let {
		shareLinkEnabled = false,
		memberCount = 0,
		canEdit = false,
		uncheckedCount = 0,
		checkedCount = 0
	}: Props = $props();

	let shareSubmitting = $state(false);
	let inviteSubmitting = $state(false);
	let shareCopied = $state(false);
	let inviteCopied = $state(false);

	const visible = $derived(shareLinkEnabled && memberCount <= 1 && canEdit);
	const hasShareableItems = $derived(uncheckedCount > 0 || checkedCount > 0);
	const itemCount = $derived(uncheckedCount + checkedCount);

	function flashCopied(setter: (value: boolean) => void) {
		setter(true);
		setTimeout(() => {
			setter(false);
		}, 2000);
	}

	async function shareList() {
		if (!browser || shareSubmitting || !hasShareableItems) {
			return;
		}

		void trackProductEvent('shopping_list_share_clicked', {
			itemCount,
			memberCount
		});

		shareSubmitting = true;
		try {
			const result = await fetchShoppingListShareUrl();
			if (!result.ok || !result.url) {
				showClientToast(result.error ?? t('shoppingListShare.shareLinkError'), { variant: 'error' });
				return;
			}

			const method = await shareShoppingListUrl(result.url);
			if (method === 'aborted') {
				return;
			}

			flashCopied((value) => (shareCopied = value));
			void trackProductEvent('list_link_shared', {
				context: 'inkop_duo_bar',
				memberCount,
				method
			});
		} catch {
			showClientToast(t('shoppingListShare.shareLinkError'), { variant: 'error' });
		} finally {
			shareSubmitting = false;
		}
	}

	async function invitePartner() {
		if (!browser || inviteSubmitting) {
			return;
		}

		void trackProductEvent('household_invite_prompt_clicked', { context: 'inkop_duo_bar' });
		inviteSubmitting = true;
		try {
			const result = await fetchHouseholdInviteUrl('inkop_duo_bar');
			if (!result.ok || !result.inviteUrl) {
				return;
			}

			const method = await shareHouseholdInviteUrl(result.inviteUrl);
			if (method === 'aborted') {
				return;
			}

			flashCopied((value) => (inviteCopied = value));
		} finally {
			inviteSubmitting = false;
		}
	}
</script>

{#if visible}
	<div
		class="duo-action-bar"
		role="region"
		aria-label={t('shopping.duoActionBar.aria')}
		data-testid="inkop-duo-action-bar"
	>
		<Button
			type="button"
			variant="primary"
			disabled={!hasShareableItems || shareSubmitting}
			loading={shareSubmitting}
			loadingLabel={t('common.loading')}
			aria-label={hasShareableItems ? t('shopping.duoActionBar.shareListAria') : t('shopping.exportEmpty')}
			data-analytics-id="inkop_duo.share_list"
			onclick={shareList}
		>
			{shareCopied ? t('common.copied') : t('shopping.duoActionBar.shareList')}
		</Button>
		<Button
			type="button"
			variant="secondary"
			disabled={inviteSubmitting}
			loading={inviteSubmitting}
			loadingLabel={t('common.loading')}
			aria-label={t('shopping.duoActionBar.invitePartnerAria')}
			data-analytics-id="inkop_duo.invite_partner"
			onclick={invitePartner}
		>
			{inviteCopied ? t('common.copied') : t('shopping.duoActionBar.invitePartner')}
		</Button>
	</div>
{/if}

<style>
	.duo-action-bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		padding: var(--space-sm);
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.duo-action-bar :global(.btn) {
		flex: 1 1 9.5rem;
		min-height: var(--touch-target-min);
	}
</style>
