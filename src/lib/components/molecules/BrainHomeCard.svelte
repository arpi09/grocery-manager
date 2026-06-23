<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { BrainScoreSnapshot } from '$lib/domain/brain-score';
	import { t } from '$lib/i18n';
	import type { MessageKey } from '$lib/i18n/messages';

	interface Props {
		snapshot: BrainScoreSnapshot;
		href?: string;
	}

	let { snapshot, href = '/settings/memory' }: Props = $props();
</script>

<Card {href} interactive class="brain-home-card" data-testid="brain-home-card">
	<div class="brain-card-inner">
		<span class="brain-icon" aria-hidden="true"><FeatureIcon id="sparkle" size={22} /></span>
		<div class="brain-copy">
			<p class="brain-score" aria-label={t('brain.homeCard.scoreAria', { score: snapshot.score })}>
				{t('brain.homeCard.score', { score: snapshot.score })}
			</p>
			<p class="brain-label">{t(snapshot.labelKey as MessageKey)}</p>
			<p class="brain-body">{t('brain.homeCard.body')}</p>
		</div>
	</div>
</Card>

<style>
	.brain-home-card {
		margin-bottom: var(--space-md);
	}

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

	.brain-score {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.brain-label {
		margin: 0.15rem 0 0;
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
</style>
