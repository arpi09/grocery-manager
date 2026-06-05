<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import NewsPathIllustration from '$lib/components/molecules/NewsPathIllustration.svelte';
	import type { NewsIllustrationId } from '$lib/data/app-news';

	interface Props {
		open: boolean;
		onClose: () => void;
		title: string;
		date: string;
		dateLabel: string;
		versionLabel?: string | null;
		body: string;
		detailBody?: string | null;
		illustration: NewsIllustrationId;
	}

	let {
		open,
		onClose,
		title,
		date,
		dateLabel,
		versionLabel = null,
		body,
		detailBody = null,
		illustration
	}: Props = $props();
</script>

<Modal
	{open}
	{onClose}
	variant="center"
	title={title}
	subtitle={versionLabel ?? undefined}
	panelClass="news-detail-panel"
	data-testid="news-detail-modal"
>
	<div class="detail-head">
		<NewsPathIllustration id={illustration} active={open} />
		<time class="date" datetime={date}>{dateLabel}</time>
	</div>
	<p class="summary">{body}</p>
	{#if detailBody}
		<p class="detail">{detailBody}</p>
	{/if}
</Modal>

<style>
	:global(.news-detail-panel) {
		width: min(34rem, calc(100vw - 2 * var(--space-md)));
	}

	.detail-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.date {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-primary);
		font-variant-numeric: tabular-nums;
	}

	.summary,
	.detail {
		margin: 0;
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
		color: var(--color-text-muted);
	}

	.detail {
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border);
		color: var(--color-text);
	}
</style>
