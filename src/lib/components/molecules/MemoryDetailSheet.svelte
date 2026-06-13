<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import MemoryConfidenceBadge from '$lib/components/molecules/MemoryConfidenceBadge.svelte';
	import MemoryCorrectLink from '$lib/components/molecules/MemoryCorrectLink.svelte';
	import MemoryExplainBlock from '$lib/components/molecules/MemoryExplainBlock.svelte';
	import MemoryForgetButton from '$lib/components/molecules/MemoryForgetButton.svelte';
	import type { MemoryFacetView } from '$lib/application/household-suggestions.service';
	import type { StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		facet: MemoryFacetView | null;
		canEdit: boolean;
		onClose: () => void;
	}

	let { open, facet, canEdit, onClose }: Props = $props();

	function locationShortLabel(location: StorageLocation): string {
		return t(`location.${location}Short` as 'location.fridgeShort');
	}

	const sheetTitle = $derived(
		facet ? `${facet.displayName} · ${locationShortLabel(facet.location)}` : ''
	);
</script>

<Modal
	{open}
	variant="sheet"
	title={sheetTitle}
	onClose={onClose}
	data-testid="memory-detail-sheet"
>
	{#if facet}
		<div class="detail-body">
			<MemoryExplainBlock explanation={facet.explanation} />

			<section class="confidence-block">
				<h3>{t('memory.detail.confidenceHeading')}</h3>
				<MemoryConfidenceBadge tier={facet.confidenceTier} />
				<p>{t('memory.confidence.hint')}</p>
			</section>

			{#if canEdit}
				<div class="actions">
					<MemoryCorrectLink itemId={facet.correctItemId} />
					<MemoryForgetButton
						type={facet.type}
						normalizedKey={facet.normalizedKey}
						location={facet.location}
						displayName={facet.displayName}
					/>
				</div>
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.detail-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.confidence-block h3 {
		margin: 0 0 var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.confidence-block p {
		margin: var(--space-sm) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
