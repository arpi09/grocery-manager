<script lang="ts">
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import type { StorageLocation } from '$lib/domain/location';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { getLocale, t } from '$lib/i18n';
	import type {
		LocationSuggestionView,
		ShelfLifeSuggestionView
	} from '$lib/application/household-suggestions.service';

	interface Props {
		shelfLifeRules: ShelfLifeSuggestionView[];
		locationRules: LocationSuggestionView[];
		canReset: boolean;
		showKivraHint: boolean;
	}

	let { shelfLifeRules, locationRules, canReset, showKivraHint }: Props = $props();

	const locale = $derived(getLocale());
	const hasRules = $derived(shelfLifeRules.length > 0 || locationRules.length > 0);

	function locationShortLabel(location: StorageLocation): string {
		const key = `location.${location}Short` as const;
		return t(key);
	}

	function shelfLifeSummary(rule: ShelfLifeSuggestionView): string {
		return t('settings.suggestions.shelfLifeRule', {
			product: rule.displayName,
			location: locationShortLabel(rule.location),
			days: rule.typicalDays,
			source: t('settings.suggestions.sourceCorrections')
		});
	}

	function locationSummary(rule: LocationSuggestionView): string {
		return t('settings.suggestions.locationRule', {
			product: rule.displayName,
			location: locationLabel(locale, rule.location),
			source: t('settings.suggestions.sourceCorrections')
		});
	}
</script>

<SettingsSection
	id="settings-suggestions"
	title={t('settings.suggestions.title')}
	description={t('settings.suggestions.description')}
>
	{#if showKivraHint}
		<p class="hint">{t('settings.suggestions.kivraHint')}</p>
	{/if}

	{#if !hasRules}
		<p class="empty">{t('settings.suggestions.empty')}</p>
	{:else}
		{#if shelfLifeRules.length > 0}
			<h3 class="subsection">{t('settings.suggestions.shelfLifeSection')}</h3>
			<ul class="rule-list">
				{#each shelfLifeRules as rule, index ( `${rule.normalizedKey}:${rule.location}`)}
					<li class:last={index === shelfLifeRules.length - 1 && locationRules.length === 0}>
						<div class="rule-body">
							<p class="rule-summary">{shelfLifeSummary(rule)}</p>
							<p class="rule-meta">
								{t('settings.suggestions.sampleCount', { count: rule.sampleCount })}
							</p>
						</div>
						{#if canReset}
							<DeleteConfirmButton
								tier={1}
								context="generic"
								copyOptions={{ itemName: rule.displayName }}
								action="?/resetShelfLifeSuggestion"
								label={t('settings.suggestions.reset')}
								ariaLabel={t('settings.suggestions.resetNamed', { name: rule.displayName })}
							>
								<input type="hidden" name="normalizedKey" value={rule.normalizedKey} />
								<input type="hidden" name="location" value={rule.location} />
							</DeleteConfirmButton>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}

		{#if locationRules.length > 0}
			<h3 class="subsection">{t('settings.suggestions.locationSection')}</h3>
			<ul class="rule-list">
				{#each locationRules as rule, index (rule.normalizedKey)}
					<li class:last={index === locationRules.length - 1}>
						<div class="rule-body">
							<p class="rule-summary">{locationSummary(rule)}</p>
							<p class="rule-meta">
								{t('settings.suggestions.sampleCount', { count: rule.sampleCount })}
							</p>
						</div>
						{#if canReset}
							<DeleteConfirmButton
								tier={1}
								context="generic"
								copyOptions={{ itemName: rule.displayName }}
								action="?/resetLocationSuggestion"
								label={t('settings.suggestions.reset')}
								ariaLabel={t('settings.suggestions.resetNamed', { name: rule.displayName })}
							>
								<input type="hidden" name="normalizedKey" value={rule.normalizedKey} />
							</DeleteConfirmButton>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</SettingsSection>

<style>
	.hint,
	.empty {
		margin: 0;
		padding: var(--space-md) var(--space-lg);
		color: var(--color-text-secondary);
	}

	.subsection {
		margin: 0;
		padding: var(--space-md) var(--space-lg) var(--space-xs);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.rule-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.rule-list li {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.rule-list li.last {
		border-bottom: none;
	}

	.rule-body {
		min-width: 0;
		flex: 1;
	}

	.rule-summary {
		margin: 0;
		font-weight: 500;
	}

	.rule-meta {
		margin: var(--space-xs) 0 0;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}
</style>
