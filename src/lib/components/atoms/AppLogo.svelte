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
			<rect x="1" y="1" width="30" height="30" rx="8.5" class="mark-bg" />
			<path
				class="mark-house"
				d="M16 8.5 9.5 13.2V22a1.2 1.2 0 0 0 1.2 1.2h3.1v-4.2h4.4v4.2h3.1A1.2 1.2 0 0 0 22.5 22v-8.8L16 8.5Z"
			/>
			<path
				class="mark-shelf"
				d="M11.8 17.2h8.4"
				stroke-width="1.35"
				stroke-linecap="round"
			/>
			<path
				class="mark-leaf"
				d="M21.2 11.2c1.6 0 2.6 1.1 2.4 2.6-.15 1.1-.95 2-2.15 2.35-.55.15-1.05.05-1.45-.2.55-.75.9-1.55.95-2.45.05-.85-.25-1.55-.75-2.25Z"
			/>
			<path class="mark-leaf-vein" d="M21.5 14.1c.7-.35 1.15-.9 1.25-1.55" stroke-width="0.9" />
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

	.mark-bg {
		fill: var(--color-primary);
	}

	.mark-house {
		fill: #fff;
	}

	.mark-shelf {
		stroke: color-mix(in srgb, var(--color-primary) 33%, #fff);
		fill: none;
	}

	.mark-leaf {
		fill: var(--color-accent);
	}

	.mark-leaf-vein {
		stroke: color-mix(in srgb, var(--color-accent) 55%, #fff);
		fill: none;
		stroke-linecap: round;
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
