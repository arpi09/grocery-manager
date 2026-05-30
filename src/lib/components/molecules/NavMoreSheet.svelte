<script lang="ts">
	import NavIcon from '$lib/components/atoms/NavIcon.svelte';
	import { t } from '$lib/i18n';
	import { isNavActive, type NavItem } from '$lib/navigation/nav-config';

	interface Props {
		pathname: string;
		items: NavItem[];
		onNavigate?: () => void;
	}

	let { pathname, items, onNavigate }: Props = $props();
</script>

<p class="section-title label-caps">{t('nav.morePages')}</p>
<ul class="sheet-list" id="nav-more-sheet">
	{#each items as item (item.href)}
		{@const active = isNavActive(pathname, item)}
		<li>
			<a
				href={item.href}
				class={['sheet-link', active ? 'active' : ''].filter(Boolean).join(' ')}
				aria-current={active ? 'page' : undefined}
				onclick={onNavigate}
			>
				<span class="sheet-icon-wrap">
					<NavIcon id={item.icon} />
				</span>
				<span class="sheet-label">{t(item.labelKey)}</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	.section-title {
		margin: 0 0 var(--space-sm);
		padding: 0 0.25rem;
	}

	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.sheet-link {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		min-height: 3rem;
		padding: 0.65rem 0.85rem;
		border-radius: var(--radius-md);
		color: var(--color-text);
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		transition: background-color 0.2s ease;
	}

	.sheet-link:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
		color: var(--color-text);
	}

	.sheet-link.active {
		background: var(--nav-active-bg);
		color: var(--color-primary);
	}

	.sheet-icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.sheet-link.active .sheet-icon-wrap {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-muted));
	}

	.sheet-label {
		min-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet-link {
			transition: none;
		}
	}
</style>
