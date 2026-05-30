<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { LOCALES, getLocale, setLocale, t, type Locale } from '$lib/i18n';

	interface Props {
		compact?: boolean;
		class?: string;
	}

	let { compact = false, class: className = '' }: Props = $props();

	const activeLocale = $derived(getLocale());
	const ariaLabel = $derived(t('settings.language.label'));

	async function selectLocale(locale: Locale) {
		setLocale(locale);
		await invalidateAll();
	}
</script>

<div
	class={['lang-switch', compact ? 'lang-switch--compact' : '', className].filter(Boolean).join(' ')}
	role="group"
	aria-label={ariaLabel}
	data-testid="language-switcher"
>
	{#each LOCALES as locale (locale)}
		<button
			type="button"
			class={['lang-btn', activeLocale === locale ? 'active' : ''].filter(Boolean).join(' ')}
			aria-pressed={activeLocale === locale}
			data-testid={`locale-${locale}`}
			onclick={() => selectLocale(locale)}
		>
			{locale.toUpperCase()}
		</button>
	{/each}
</div>

<style>
	.lang-switch {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		padding: 0.15rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-muted);
	}

	.lang-btn {
		min-width: 2.25rem;
		min-height: 2rem;
		padding: 0.2rem 0.55rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		cursor: pointer;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;
	}

	.lang-btn:hover {
		color: var(--color-text);
	}

	.lang-btn.active {
		background: var(--color-surface);
		color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}

	.lang-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.lang-switch--compact .lang-btn {
		min-width: 2rem;
		min-height: 1.75rem;
		font-size: 0.68rem;
	}
</style>
