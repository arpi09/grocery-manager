<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
	import { renderExplanationContent } from '$lib/domain/learning/prediction-explain';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		explanation: PredictionExplanation | null;
		onClose: () => void;
		showSettingsLink?: boolean;
	}

	let { open, explanation, onClose, showSettingsLink = false }: Props = $props();

	const content = $derived(explanation ? renderExplanationContent(explanation) : null);
</script>

<Modal
	{open}
	variant="sheet"
	title={t('learning.explain.title')}
	onClose={onClose}
	data-testid="prediction-explain-sheet"
>
	{#if content}
		<div class="explain-body">
			<p class="primary">{content.primary}</p>
			{#if content.facts.length > 0}
				<ul class="facts">
					{#each content.facts as fact (fact)}
						<li>{fact}</li>
					{/each}
				</ul>
			{/if}
			{#if content.learnMore}
				<p class="learn-more">{content.learnMore}</p>
			{/if}
			{#if showSettingsLink}
				<a class="settings-link" href="/settings/memory">
					{t('learning.explain.settingsLink')}
				</a>
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.explain-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.primary {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--color-text);
	}

	.facts {
		margin: 0;
		padding-left: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.925rem;
		line-height: 1.45;
	}

	.learn-more {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.settings-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-size: 0.925rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.settings-link:hover {
		text-decoration: underline;
	}
</style>
