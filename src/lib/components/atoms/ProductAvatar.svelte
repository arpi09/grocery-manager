<script lang="ts">
	interface Props {
		name: string;
		imageUrl?: string | null;
		warn?: boolean;
		size?: 'sm' | 'md';
		muted?: boolean;
		ariaLabel?: string;
		/** When true, avatar is presentational (parent provides aria-label). */
		decorative?: boolean;
	}

	let {
		name,
		imageUrl = null,
		warn = false,
		size = 'sm',
		muted = false,
		ariaLabel,
		decorative = false
	}: Props = $props();

	let imageFailed = $state(false);

	const initial = $derived(name.trim().charAt(0).toLocaleUpperCase() || '?');
	const showImage = $derived(Boolean(imageUrl) && !imageFailed);
	const label = $derived(ariaLabel ?? name);
</script>

<span
	class="product-avatar"
	class:product-avatar--sm={size === 'sm'}
	class:product-avatar--md={size === 'md'}
	class:product-avatar--warn={warn}
	class:product-avatar--muted={muted}
	data-testid="product-avatar"
	role={decorative ? undefined : 'img'}
	aria-hidden={decorative ? true : undefined}
	aria-label={decorative ? undefined : label}
>
	{#if showImage}
		<img
			class="product-avatar__image"
			src={imageUrl}
			alt=""
			loading="lazy"
			decoding="async"
			onerror={() => {
				imageFailed = true;
			}}
		/>
	{:else}
		<span class="product-avatar__initial" aria-hidden="true">{initial}</span>
	{/if}
	{#if warn}
		<span class="product-avatar__warn-dot" aria-hidden="true"></span>
	{/if}
</span>

<style>
	.product-avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
		color: var(--color-text);
		font-weight: 700;
		overflow: hidden;
	}

	.product-avatar--sm {
		width: 1.75rem;
		height: 1.75rem;
		font-size: 0.875rem;
	}

	.product-avatar--md {
		width: 2.5rem;
		height: 2.5rem;
		font-size: 1rem;
	}

	.product-avatar--warn {
		border-color: color-mix(in srgb, var(--color-warning) 50%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-surface));
	}

	.product-avatar--muted {
		opacity: 0.55;
	}

	.product-avatar__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: var(--color-surface);
	}

	.product-avatar__initial {
		line-height: 1;
	}

	.product-avatar__warn-dot {
		position: absolute;
		top: 0;
		right: 0;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--color-warning);
		border: 1px solid var(--color-surface);
	}
</style>
