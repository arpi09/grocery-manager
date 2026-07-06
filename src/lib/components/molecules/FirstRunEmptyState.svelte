<script lang="ts">
	interface Props {
		icon: string;
		title: string;
		body: string;
		ctaLabel?: string;
		ctaHref?: string;
		onCta?: () => void;
		/** Alternate path rendered as a text link — never a second filled button. */
		secondaryLabel?: string;
		secondaryHref?: string;
		helperText?: string;
		analyticsId?: string;
		testid?: string;
	}

	let {
		icon,
		title,
		body,
		ctaLabel,
		ctaHref,
		onCta,
		secondaryLabel,
		secondaryHref,
		helperText,
		analyticsId,
		testid
	}: Props = $props();

	const descId = $props.id();
	const hasCta = $derived(Boolean(ctaLabel && (ctaHref || onCta)));
</script>

<section class="first-run" data-testid={testid}>
	<span class="icon-tile" aria-hidden="true">{icon}</span>

	<div class="copy">
		<h2>{title}</h2>
		<p id={descId}>{body}</p>
	</div>

	<div class="cta-block">
		{#if hasCta}
			{#if onCta}
				<button
					type="button"
					class="cta"
					aria-describedby={descId}
					data-analytics-id={analyticsId}
					onclick={onCta}
				>
					<span class="cta-glyph" aria-hidden="true">+</span>{ctaLabel}
				</button>
			{:else if ctaHref}
				<a class="cta" href={ctaHref} aria-describedby={descId} data-analytics-id={analyticsId}>
					<span class="cta-glyph" aria-hidden="true">+</span>{ctaLabel}
				</a>
			{/if}
		{/if}
		{#if secondaryLabel && secondaryHref}
			<a class="secondary-link" href={secondaryHref}>{secondaryLabel}</a>
		{/if}
		{#if helperText}
			<p class="helper">
				<span class="helper-chip" aria-hidden="true">↺</span>
				{helperText}
			</p>
		{/if}
	</div>
</section>

<style>
	.first-run {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		text-align: left;
		gap: var(--space-xl);
		padding: var(--space-xl) 0 var(--space-lg);
		min-height: min(55vh, 30rem);
		animation: rise-in 0.5s ease both;
	}

	@keyframes rise-in {
		0% {
			transform: translateY(10px);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.first-run {
			animation: none;
		}
	}

	.icon-tile {
		width: 60px;
		height: 60px;
		border-radius: var(--radius-md);
		display: grid;
		place-items: center;
		font-size: 30px;
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	h2 {
		margin: 0;
		font-size: 2rem;
		line-height: 1.12;
		font-weight: var(--font-weight-display);
		letter-spacing: -0.03em;
		color: var(--color-text);
		white-space: pre-line;
		text-wrap: balance;
	}

	.copy p {
		margin: 0;
		font-size: var(--font-size-body-md);
		line-height: 1.55;
		color: var(--color-text-muted);
		max-width: 32ch;
		text-wrap: pretty;
	}

	.cta-block {
		align-self: stretch;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.cta {
		box-sizing: border-box;
		min-height: 3.25rem;
		border: 0;
		border-radius: var(--radius-md);
		padding: 0 var(--space-lg);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		font-size: var(--font-size-body-md);
		font-weight: var(--font-weight-label);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		text-decoration: none;
		box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary) 22%, transparent);
		transition:
			background 0.18s,
			transform 0.05s;
	}

	.cta:hover {
		background: var(--color-primary-hover);
	}

	.cta:active {
		transform: translateY(1px);
	}

	.cta:focus-visible {
		outline: 3px solid var(--color-text);
		outline-offset: 3px;
	}

	.cta-glyph {
		font-size: 20px;
		line-height: 1;
	}

	.secondary-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min, 2.75rem);
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
	}

	.secondary-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.helper {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: var(--font-size-label);
		color: var(--color-text-muted);
	}

	.helper-chip {
		flex: none;
		display: grid;
		place-items: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-surface-muted);
		font-size: 10px;
	}
</style>
