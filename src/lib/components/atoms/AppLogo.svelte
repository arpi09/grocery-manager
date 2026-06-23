<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		size?: Size;
		showWordmark?: boolean;
		wordmark?: string;
		href?: string;
		class?: ClassValue;
	}

	let { size = 'md', showWordmark = false, wordmark = 'Skaffu', href, class: className }: Props = $props();

	const markSizes: Record<Size, string> = {
		sm: '1.85rem',
		md: '2.25rem',
		lg: '3rem'
	};

	const markSize = $derived(markSizes[size]);
</script>

{#snippet logoContent()}
	<span
		class={['app-logo', showWordmark && 'with-wordmark', className]}
		style:--logo-mark-size={markSize}
	>
		<svg
			class="mark"
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect width="32" height="32" rx="8" fill="#2c4a3e" />
			<path
				fill="#ffffff"
				d="M16 8.5 9.5 13.2V22a1.2 1.2 0 0 0 1.2 1.2h3.1v-4.2h4.4v4.2h3.1A1.2 1.2 0 0 0 22.5 22v-8.8L16 8.5Z"
			/>
			<path
				d="M11.8 17.2h8.4"
				stroke="#e8f0ea"
				stroke-width="1.35"
				stroke-linecap="round"
				fill="none"
			/>
			<rect x="20.8" y="10.8" width="4.2" height="4.2" rx="1" fill="#d4a853" />
		</svg>
		{#if showWordmark}
			<span class="wordmark" aria-hidden="true">{wordmark}</span>
		{/if}
	</span>
{/snippet}

{#if href}
	<a {href} class="app-logo-link" aria-label={wordmark}>
		{@render logoContent()}
	</a>
{:else}
	{@render logoContent()}
{/if}

<style>
	.app-logo-link {
		display: inline-flex;
		color: inherit;
		text-decoration: none;
	}

	.app-logo-link:hover {
		text-decoration: none;
		color: inherit;
	}

	.app-logo {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--color-text);
		line-height: 1;
	}

	.app-logo.with-wordmark {
		flex-direction: column;
		gap: 0.65rem;
		text-align: center;
	}

	.mark {
		width: var(--logo-mark-size, 2.25rem);
		height: var(--logo-mark-size, 2.25rem);
		flex-shrink: 0;
	}

	.wordmark {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: var(--color-text);
	}

	.app-logo.with-wordmark .wordmark {
		font-size: clamp(1.25rem, 4vw, 1.5rem);
	}
</style>
