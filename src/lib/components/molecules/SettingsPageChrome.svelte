<script lang="ts">
	import SettingsSectionNav, {
		type SettingsNavItem
	} from '$lib/components/molecules/SettingsSectionNav.svelte';

	interface Props {
		title: string;
		subtitle?: string;
		items: SettingsNavItem[];
	}

	let { title, subtitle, items }: Props = $props();
</script>

<div class="settings-chrome">
	<div class="settings-chrome-header">
		<h1>{title}</h1>
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>
	<SettingsSectionNav {items} embedded />
</div>

<style>
	.settings-chrome {
		position: sticky;
		top: var(--sticky-below-header);
		z-index: var(--z-sticky-chrome);
		margin: 0 calc(-1 * var(--page-padding-x)) var(--space-md);
		padding: var(--space-sm) var(--page-padding-x) 0;
		background: color-mix(in srgb, var(--color-bg) 92%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--color-border);
	}

	.settings-chrome-header h1 {
		margin: 0;
		font-size: clamp(1.25rem, 2.5vw, 1.55rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.subtitle {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.92rem;
		line-height: 1.45;
		max-width: 42ch;
	}

	@media (max-width: 719px) {
		.subtitle {
			display: none;
		}
	}

	@media (min-width: 720px) {
		.settings-chrome {
			margin-bottom: var(--page-section-gap);
		}
	}
</style>
