<script lang="ts">
	import { t } from '$lib/i18n';

	export type SettingsNavItem = {
		id: string;
		label: string;
	};

	interface Props {
		items: SettingsNavItem[];
	}

	let { items }: Props = $props();
</script>

<nav class="settings-nav" aria-label={t('settings.nav.aria')}>
	<ul class="settings-nav-list">
		{#each items as item (item.id)}
			<li>
				<a class="settings-nav-link" href={`#${item.id}`}>{item.label}</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.settings-nav {
		position: sticky;
		top: var(--sticky-below-header);
		z-index: var(--z-sticky-chrome);
		margin: 0 calc(-1 * var(--page-padding-x)) var(--space-md);
		padding: var(--space-sm) var(--page-padding-x);
		background: color-mix(in srgb, var(--color-bg) 92%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--color-border);
	}

	.settings-nav-list {
		display: flex;
		flex-wrap: nowrap;
		gap: var(--space-xs);
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.settings-nav-list::-webkit-scrollbar {
		display: none;
	}

	.settings-nav-link {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.4rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.settings-nav-link:hover {
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		text-decoration: none;
	}

	.settings-nav-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	@media (min-width: 720px) {
		.settings-nav {
			margin-bottom: var(--page-section-gap);
		}
	}
</style>
