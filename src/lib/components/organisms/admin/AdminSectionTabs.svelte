<script lang="ts">
	import { t } from '$lib/i18n';

	export type AdminTab =
		| 'overview'
		| 'analytics'
		| 'aiUsage'
		| 'users'
		| 'logs'
		| 'feedback'
		| 'pmfSurvey';

	interface Props {
		active: AdminTab;
		onSelect: (tab: AdminTab) => void;
	}

	let { active, onSelect }: Props = $props();

	const tabs: { id: AdminTab; label: string }[] = [
		{ id: 'overview', label: t('admin.tabs.overview') },
		{ id: 'analytics', label: t('admin.tabs.analytics') },
		{ id: 'aiUsage', label: t('admin.tabs.aiUsage') },
		{ id: 'users', label: t('admin.users') },
		{ id: 'logs', label: t('admin.errorLogs') },
		{ id: 'feedback', label: t('admin.tabs.feedback') },
		{ id: 'pmfSurvey', label: t('admin.tabs.pmfSurvey') }
	];
</script>

<nav class="admin-tabs" aria-label={t('admin.tabs.aria')}>
	<div class="admin-tabs-scroll">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				class="tab"
				class:active={active === tab.id}
				aria-current={active === tab.id ? 'page' : undefined}
				onclick={() => onSelect(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</nav>

<style>
	.admin-tabs {
		margin-bottom: var(--space-lg);
	}

	.admin-tabs-scroll {
		display: flex;
		gap: var(--space-xs);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		padding-bottom: 2px;
	}

	.admin-tabs-scroll::-webkit-scrollbar {
		display: none;
	}

	.tab {
		flex: 0 0 auto;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		min-height: 2.5rem;
		display: inline-flex;
		align-items: center;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}
</style>
