<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { BrainScoreSnapshot } from '$lib/domain/brain-score';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';
	import { receiptOneTapHref } from '$lib/utils/scan-nav';

	interface Props {
		snapshot: BrainScoreSnapshot;
		href?: string;
	}

	let { snapshot, href = '/settings/memory' }: Props = $props();

	const showUnlockCta = $derived(snapshot.score < 50);
	const cardHref = $derived(showUnlockCta ? receiptOneTapHref('/hem') : href);
</script>

<Card href={cardHref} interactive class="brain-home-card" data-testid="brain-home-card">
	<div class="brain-card-inner">
		<span class="brain-icon" aria-hidden="true"><FeatureIcon id="sparkle" size={22} /></span>
		<div class="brain-copy">
			<p class="brain-label">{t(snapshot.labelKey as MessageKey)}</p>
			{#if showUnlockCta}
				<p class="brain-cta">{t('brain.homeCard.unlockCta')}</p>
			{:else}
				<p class="brain-body">{t('brain.homeCard.body')}</p>
			{/if}
		</div>
	</div>
</Card>

<style>
	.brain-card-inner {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.brain-icon {
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.brain-copy {
		min-width: 0;
	}

	.brain-label {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.brain-body {
		margin: 0.35rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.brain-cta {
		margin: 0.35rem 0 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		line-height: 1.35;
	}
</style>
