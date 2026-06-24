<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { t } from '$lib/i18n';
	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';
	import {
		EXPIRY_NUDGE_ITEM_PARAM,
		EXPIRY_NUDGE_NAME_PARAM
	} from '$lib/utils/expiry-nudge';

	let dismissed = $state(false);

	const itemId = $derived(page.url.searchParams.get(EXPIRY_NUDGE_ITEM_PARAM));
	const itemName = $derived(page.url.searchParams.get(EXPIRY_NUDGE_NAME_PARAM) ?? '');
	const editHref = $derived(
		itemId
			? `/item/${itemId}/edit?from=${encodeURIComponent(page.url.pathname + page.url.search)}`
			: null
	);

	$effect(() => {
		void itemId;
		void itemName;
		dismissed = false;
	});

	const visible = $derived(Boolean(itemId && itemName && !dismissed));

	function clearParams() {
		const url = new URL(page.url);
		url.searchParams.delete(EXPIRY_NUDGE_ITEM_PARAM);
		url.searchParams.delete(EXPIRY_NUDGE_NAME_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleDismiss() {
		dismissed = true;
		clearParams();
	}
</script>

{#if visible}
	<div class="expiry-nudge-wrap">
		<Toast
			message={t('item.expiryNudgeToast', { name: itemName })}
			{visible}
			variant="info"
			size="action"
			durationMs={TOAST_DEFAULT_DURATION_MS}
			tapToDismiss={false}
			onDismiss={handleDismiss}
		/>
		{#if editHref}
			<a class="expiry-nudge-link" href={editHref} data-analytics-id="expiry_nudge.edit">
				{t('item.expiryNudgeEdit')}
			</a>
		{/if}
		<button type="button" class="expiry-nudge-dismiss" onclick={handleDismiss}>
			{t('common.close')}
		</button>
	</div>
{/if}

<style>
	.expiry-nudge-wrap {
		position: fixed;
		left: var(--page-padding-x);
		right: var(--page-padding-x);
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-xs);
		max-width: 24rem;
		margin-inline: auto;
	}

	.expiry-nudge-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		font-size: 0.875rem;
		text-decoration: none;
	}

	.expiry-nudge-dismiss {
		align-self: center;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font: inherit;
		font-size: 0.8125rem;
		cursor: pointer;
		text-decoration: underline;
	}
</style>
