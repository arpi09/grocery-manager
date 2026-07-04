<script lang="ts">
	import type { HomeBriefingMessagePresentation } from '$lib/domain/home-briefing-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		greeting: HomeBriefingMessagePresentation;
		status: HomeBriefingMessagePresentation;
		statusOverride?: string | null;
		/** True when statusOverride is the AI-generated one-liner (needs provenance marking). */
		aiGenerated?: boolean;
	}

	let { greeting, status, statusOverride = null, aiGenerated = false }: Props = $props();

	const isAiLine = $derived(aiGenerated && Boolean(statusOverride?.trim()));
	let hintOpen = $state(false);
</script>

<div class="home-briefing-greeting" data-testid="home-briefing-greeting">
	<h1 class="greeting">{t(greeting.key, greeting.params)}</h1>
	<p class="status-line" data-testid="home-v2-status">
		<span>{statusOverride?.trim() ? statusOverride : t(status.key, status.params)}</span>
		{#if isAiLine}
			<button
				type="button"
				class="ai-marker"
				aria-expanded={hintOpen}
				aria-label={t('home.v6.aiOneLiner.aria')}
				data-testid="home-v2-status-ai-marker"
				onclick={() => (hintOpen = !hintOpen)}
			>
				{t('learning.aiBadge')}
			</button>
		{/if}
	</p>
	{#if isAiLine && hintOpen}
		<p class="ai-hint" role="status" data-testid="home-v2-status-ai-hint">
			{t('home.v6.aiOneLiner.hint')}
		</p>
	{/if}
</div>

<style>
	.home-briefing-greeting {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.greeting {
		margin: 0;
		font-size: var(--font-size-display, 1.75rem);
		font-weight: var(--font-weight-display, 700);
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.status-line {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm, 0.9375rem);
		line-height: 1.45;
	}

	.ai-marker {
		display: inline-flex;
		align-items: center;
		min-height: 1.75rem;
		margin-left: 0.4rem;
		padding: 0.1rem 0.45rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.375rem);
		background: var(--color-surface-muted, transparent);
		color: var(--color-text-muted);
		font: inherit;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		line-height: 1.2;
		cursor: pointer;
		vertical-align: middle;
	}

	.ai-marker:hover {
		color: var(--color-text);
	}

	.ai-marker:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	.ai-hint {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		line-height: 1.4;
		max-width: 32rem;
	}
</style>
