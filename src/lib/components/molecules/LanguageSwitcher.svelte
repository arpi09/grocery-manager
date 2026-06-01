<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { LOCALES, getLocale, setLocale, t, type Locale } from '$lib/i18n';

	interface Props {
		compact?: boolean;
		class?: string;
	}

	let { compact = false, class: className = '' }: Props = $props();

	const activeLocale = $derived(getLocale());
	const activeIndex = $derived(LOCALES.indexOf(activeLocale));
	const ariaLabel = $derived(t('settings.language.label'));

	async function selectLocale(locale: Locale) {
		if (locale === activeLocale) return;
		setLocale(locale);
		await invalidateAll();
	}
</script>

<div
	class={['lang-switch', compact ? 'lang-switch--compact' : '', className].filter(Boolean).join(' ')}
	style={`--active-index: ${activeIndex}`}
	role="group"
	aria-label={ariaLabel}
	data-testid="language-switcher"
>
	<span class="lang-thumb" aria-hidden="true"></span>
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
		position: relative;
		display: inline-grid;
		grid-template-columns: repeat(2, 1fr);
		align-items: center;
		padding: 0.2rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-muted);
		min-width: 5.5rem;
	}

	.lang-thumb {
		position: absolute;
		top: 0.2rem;
		bottom: 0.2rem;
		left: 0.2rem;
		width: calc((100% - 0.4rem) / 2);
		border-radius: 999px;
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		pointer-events: none;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateX(calc(var(--active-index) * 100%));
	}

	.lang-btn {
		position: relative;
		z-index: 1;
		min-width: 2.5rem;
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
		transition: color 0.15s ease;
	}

	.lang-btn:hover {
		color: var(--color-text);
	}

	.lang-btn.active {
		color: var(--color-primary);
	}

	.lang-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.lang-switch--compact {
		min-width: 5rem;
	}

	.lang-switch--compact .lang-btn {
		min-width: 2.25rem;
		min-height: 1.75rem;
		font-size: 0.68rem;
	}
</style>
