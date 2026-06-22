<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import {
		defaultBlockForReportReason,
		MARKET_CHAT_REPORT_REASONS,
		type MarketChatReportReason
	} from '$lib/domain/market-lifecycle';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		open: boolean;
		threadId: string;
		onClose: () => void;
		onReported?: () => void;
	}

	let { open, threadId, onClose, onReported }: Props = $props();

	let reason = $state<MarketChatReportReason>('inappropriate');
	let blockCounterpart = $state(defaultBlockForReportReason('inappropriate'));
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			reason = 'inappropriate';
			blockCounterpart = defaultBlockForReportReason('inappropriate');
		}
	});

	function onReasonChange(next: MarketChatReportReason) {
		reason = next;
		blockCounterpart = defaultBlockForReportReason(next);
	}

	async function submitReport() {
		submitting = true;
		try {
			const response = await fetch(`/api/market/chat/${threadId}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason, blockCounterpart })
			});

			if (!response.ok) {
				showClientToast(t('marketV01.reportChatFailed'), { variant: 'error' });
				return;
			}

			showClientToast(
				blockCounterpart
					? t('marketV03.reportSuccessBlocked')
					: t('marketV03.reportSuccess'),
				{ variant: 'success' }
			);
			onClose();
			onReported?.();
		} catch {
			showClientToast(t('marketV01.reportChatFailed'), { variant: 'error' });
		} finally {
			submitting = false;
		}
	}
</script>

<Modal
	{open}
	{onClose}
	title={t('marketV03.reportModalTitle')}
	subtitle={t('marketV03.reportModalLead')}
	data-testid="market-report-modal"
>
	<fieldset class="reason-fieldset">
		<legend class="sr-only">{t('marketV03.reportReasonLegend')}</legend>
		{#each MARKET_CHAT_REPORT_REASONS as reportReason (reportReason)}
			<label class="reason-option">
				<input
					type="radio"
					name="market-report-reason"
					value={reportReason}
					checked={reason === reportReason}
					onchange={() => onReasonChange(reportReason)}
				/>
				<span>{t(`marketV03.reportReason.${reportReason}`)}</span>
			</label>
		{/each}
	</fieldset>

	<label class="block-option">
		<input type="checkbox" bind:checked={blockCounterpart} />
		<span>{t('marketV03.reportBlockCheckbox')}</span>
	</label>

	{#snippet footer()}
		<div class="modal-actions">
			<Button type="button" variant="secondary" onclick={onClose} disabled={submitting}>
				{t('common.cancel')}
			</Button>
			<Button
				type="button"
				variant="danger"
				loading={submitting}
				loadingLabel={t('common.loading')}
				data-testid="market-report-submit"
				onclick={() => void submitReport()}
			>
				{t('marketV03.reportSubmitBtn')}
			</Button>
		</div>
	{/snippet}
</Modal>

<style>
	.reason-fieldset {
		margin: 0;
		padding: 0;
		border: none;
		display: grid;
		gap: var(--space-sm);
	}

	.reason-option,
	.block-option {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		cursor: pointer;
		font-size: 0.9375rem;
	}

	.reason-option input,
	.block-option input {
		margin-top: 0.2rem;
		flex-shrink: 0;
	}

	.block-option {
		margin-top: var(--space-md);
		color: var(--color-text-muted);
	}

	.modal-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
