<script lang="ts">
	import type { HomeBriefingMessagePresentation } from '$lib/domain/home-briefing-presenter';
	import { t } from '$lib/i18n';

	interface Props {
		greeting: HomeBriefingMessagePresentation;
		status: HomeBriefingMessagePresentation;
		statusOverride?: string | null;
	}

	let { greeting, status, statusOverride = null }: Props = $props();
</script>

<div class="home-briefing-greeting" data-testid="home-briefing-greeting">
	<h1 class="greeting">{t(greeting.key, greeting.params)}</h1>
	<p class="status-line" data-testid="home-v2-status">
		{statusOverride?.trim() ? statusOverride : t(status.key, status.params)}
	</p>
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
</style>
