<script lang="ts">

	import { browser } from '$app/environment';

	import { invalidateAll } from '$app/navigation';

	import Button from '$lib/components/atoms/Button.svelte';

	import Card from '$lib/components/atoms/Card.svelte';

	import EmptyState from '$lib/components/molecules/EmptyState.svelte';

	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';

	import Toast from '$lib/components/molecules/Toast.svelte';

	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { daysSinceLastConfirmed } from '$lib/domain/inventory-staleness';

	import { locationLabel } from '$lib/i18n/domain-labels';

	import { getLocale, t } from '$lib/i18n';

	import { TOAST_DEFAULT_DURATION_MS } from '$lib/utils/action-toast';

	import { showClientToast } from '$lib/utils/client-toast.svelte';



	interface SerializedItem extends Omit<InventoryItem, 'createdAt' | 'updatedAt' | 'lastConfirmedAt'> {

		createdAt: string;

		updatedAt: string;

		lastConfirmedAt: string;

	}



	interface Props {

		initialItems: SerializedItem[];

		initialRemaining: number;

		canWrite?: boolean;

	}



	let { initialItems, initialRemaining, canWrite = false }: Props = $props();



	let items = $state<SerializedItem[]>([]);

	let remaining = $state(0);

	let actingId = $state<string | null>(null);

	let errorMessage = $state<string | null>(null);

	let undoPayload = $state<{

		id: string;

		name: string;

		quantity: string;

	} | null>(null);

	let undoSubmitting = $state(false);
	let initialTotal = $state(0);
	let bulkSubmitting = $state(false);

	const reviewedCount = $derived(Math.max(0, initialTotal - remaining));
	const photoScanHref = '/scan?mode=photo&from=/inventory/synk';



	const undoMessage = $derived(

		undoPayload

			? t('consume.undoToastNamed', { name: undoPayload.name })

			: t('consume.undoToast')

	);



	$effect(() => {

		items = initialItems;

		remaining = initialRemaining;

		if (initialTotal === 0 && initialRemaining > 0) {
			initialTotal = initialRemaining;
		}

	});



	async function refreshBatch() {

		const response = await fetch('/api/inventory/staleness');

		if (!response.ok) return;

		const data = (await response.json()) as { items: SerializedItem[]; remaining: number };

		items = data.items;

		remaining = data.remaining;

	}



	async function act(itemId: string, action: 'confirm' | 'finish') {

		if (!canWrite || actingId) return;

		actingId = itemId;

		errorMessage = null;



		const item = items.find((entry) => entry.id === itemId);

		const wasLastInBatch = items.length === 1;



		try {

			const response = await fetch('/api/inventory/staleness', {

				method: 'POST',

				headers: { 'Content-Type': 'application/json' },

				body: JSON.stringify({

					itemId,

					action,

					batchComplete: wasLastInBatch

				})

			});

			const data = (await response.json()) as { error?: string };



			if (!response.ok) {

				errorMessage = data.error ?? t('staleness.actionFailed');

				return;

			}



			if (action === 'confirm') {

				showClientToast(t('staleness.confirmSuccess'), { variant: 'success' });

			} else if (item) {

				undoPayload = { id: item.id, name: item.name, quantity: item.quantity };

			}



			await refreshBatch();

		} catch {

			errorMessage = t('staleness.actionFailed');

		} finally {

			actingId = null;

		}

	}



	async function undoFinish() {

		if (!browser || !undoPayload) {

			return;

		}



		undoSubmitting = true;

		const formData = new FormData();

		formData.set('itemId', undoPayload.id);

		formData.set('quantity', undoPayload.quantity);



		try {

			const response = await fetch('?/undoConsume', { method: 'POST', body: formData });

			if (response.ok) {

				undoPayload = null;

				await invalidateAll();

				await refreshBatch();

			}

		} finally {

			undoSubmitting = false;

		}

	}



	function dismissUndo() {

		undoPayload = null;

	}



	function formatQuantity(item: SerializedItem): string {

		return item.unit ? `${item.quantity} ${item.unit}` : item.quantity;

	}

	function confirmedDaysLabel(item: SerializedItem): string {
		const days = daysSinceLastConfirmed(new Date(item.lastConfirmedAt));
		if (days <= 0) return t('staleness.confirmedToday');
		if (days === 1) return t('staleness.confirmedYesterday');
		return t('staleness.confirmedDaysAgo', { count: days });
	}

	async function confirmAll() {
		if (!canWrite || bulkSubmitting || items.length < 3) return;
		bulkSubmitting = true;
		errorMessage = null;
		try {
			const response = await fetch('/api/inventory/staleness', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'confirmAll',
					itemIds: items.map((item) => item.id)
				})
			});
			const data = (await response.json()) as { error?: string; confirmed?: number };
			if (!response.ok) {
				errorMessage = data.error ?? t('staleness.actionFailed');
				return;
			}
			showClientToast(t('staleness.confirmAllSuccess', { count: data.confirmed ?? items.length }), {
				variant: 'success'
			});
			await refreshBatch();
		} catch {
			errorMessage = t('staleness.actionFailed');
		} finally {
			bulkSubmitting = false;
		}
	}

</script>



<section class="batch-review" aria-label={t('staleness.ariaLabel')}>

	<header class="header">

		<h1>{t('staleness.title')}</h1>

		<p class="intro">{t('staleness.intro')}</p>

		{#if initialTotal > 0}
			<p class="progress" role="status">
				{t('staleness.progress', { done: reviewedCount, total: initialTotal })}
			</p>
		{/if}

		{#if remaining > 0}

			<p class="remaining" role="status">{t('staleness.remaining', { count: remaining })}</p>

		{/if}

	</header>



	{#if errorMessage}

		<FeedbackBanner tone="error" message={errorMessage} />

	{/if}



	{#if items.length === 0}

		<EmptyState

			iconId="sparkle"

			title={t('staleness.emptyTitle')}

			description={t('staleness.emptyDescription')}

			actionLabel={t('staleness.emptyAction')}

			actionHref={photoScanHref}

		/>

	{:else}

		{#if canWrite && items.length >= 3}
			<Button
				type="button"
				variant="secondary"
				fullWidth
				loading={bulkSubmitting}
				loadingLabel={t('common.saving')}
				onclick={confirmAll}
				data-analytics-id="staleness.confirm_all"
			>
				{t('staleness.confirmAll')}
			</Button>
		{/if}

		<ul class="items">

			{#each items as item (item.id)}

				<li>

					<Card class="item-card">

						<div class="copy">

							<span class="name">{item.name}</span>

							<span class="meta">

								{locationLabel(getLocale(), item.location)} · {formatQuantity(item)}

							</span>

							<span class="hint">{confirmedDaysLabel(item)}</span>

						</div>

						{#if canWrite}

							<div class="actions">

								<Button

									type="button"

									variant="secondary"

									loading={actingId === item.id}

									loadingLabel={t('common.saving')}

									onclick={() => act(item.id, 'confirm')}

									data-analytics-id="staleness.confirm"

								>

									{t('staleness.confirm')}

								</Button>

								<Button

									type="button"

									loading={actingId === item.id}

									loadingLabel={t('common.saving')}

									onclick={() => act(item.id, 'finish')}

									data-analytics-id="staleness.finish"

								>

									{t('staleness.finish')}

								</Button>

							</div>

						{/if}

					</Card>

				</li>

			{/each}

		</ul>

	{/if}

</section>



{#if undoPayload}

	<div class="undo-toast-wrap">

		<Toast

			message={undoMessage}

			visible={true}

			variant="success"

			size="action"

			durationMs={TOAST_DEFAULT_DURATION_MS}

			tapToDismiss={true}

			onDismiss={dismissUndo}

		/>

		<button

			type="button"

			class="undo-btn"

			disabled={undoSubmitting}

			onclick={undoFinish}

			aria-label={t('common.undo')}

		>

			{t('common.undo')}

		</button>

	</div>

{/if}



<style>

	.batch-review {

		display: flex;

		flex-direction: column;

		gap: var(--space-md);

	}



	.header h1 {

		margin: 0;

		font-size: 1.5rem;

		letter-spacing: -0.02em;

	}



	.intro,
	.progress,
	.remaining {

		margin: var(--space-xs) 0 0;

		color: var(--color-text-muted);

		font-size: 0.9375rem;

		line-height: 1.45;

	}



	.items {

		list-style: none;

		margin: 0;

		padding: 0;

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

	}



	:global(.item-card) {

		display: flex;

		flex-direction: column;

		gap: var(--space-md);

	}



	.copy {

		display: flex;

		flex-direction: column;

		gap: var(--space-xs);

	}



	.name {

		font-weight: 700;

		font-size: 1.125rem;

	}



	.meta,

	.hint {

		font-size: 0.875rem;

		color: var(--color-text-muted);

	}



	.actions {

		display: flex;

		flex-direction: column;

		gap: var(--space-sm);

	}



	.undo-toast-wrap {

		position: fixed;

		left: var(--page-padding-x);

		right: var(--page-padding-x);

		bottom: calc(var(--content-bottom-safe) + var(--space-sm));

		z-index: 40;

		display: flex;

		align-items: stretch;

		gap: var(--space-xs);

		max-width: 28rem;

		margin-inline: auto;

	}



	.undo-btn {

		flex-shrink: 0;

		min-height: 2.75rem;

		padding: 0 1rem;

		border: 1px solid var(--color-border);

		border-radius: var(--radius-md);

		background: var(--color-surface);

		color: var(--color-primary);

		font: inherit;

		font-weight: 700;

		font-size: 0.875rem;

		cursor: pointer;

	}



	.undo-btn:disabled {

		opacity: 0.6;

		cursor: not-allowed;

	}



	@media (min-width: 480px) {

		:global(.item-card) {

			flex-direction: row;

			align-items: center;

			justify-content: space-between;

		}



		.actions {

			flex-shrink: 0;

			min-width: 11rem;

		}

	}

</style>

