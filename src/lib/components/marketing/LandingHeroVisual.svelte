<script lang="ts">
	import type { MarketingContent } from '$lib/marketing/content';

	interface Props {
		copy: MarketingContent['landing']['heroVisual'];
	}

	let { copy }: Props = $props();
</script>

<div class="visual" aria-hidden="true">
	<div class="glow"></div>
	<div class="phone">
		<div class="phone-notch"></div>
		<header class="phone-top">
			<span class="chip fridge">{copy.fridge}</span>
			<span class="chip freezer">{copy.freezer}</span>
			<span class="chip cupboard">{copy.cupboard}</span>
		</header>
		<div class="eat-first">
			<span class="eat-badge">{copy.eatFirstBadge}</span>
			<p class="eat-copy">{copy.eatFirstCaption}</p>
		</div>
		<ul class="items">
			<li>
				<span class="dot fridge"></span>
				<span class="line wide"></span>
				<span class="date warn">{copy.expiryDays[0]}</span>
			</li>
			<li>
				<span class="dot cupboard"></span>
				<span class="line"></span>
				<span class="date ok">{copy.expiryDays[1]}</span>
			</li>
			<li>
				<span class="dot freezer"></span>
				<span class="line mid"></span>
				<span class="date">{copy.expiryDays[2]}</span>
			</li>
		</ul>
		<div class="list-preview">
			<span class="list-label">{copy.shoppingList}</span>
			<span class="list-pill">{copy.shoppingListPill}</span>
		</div>
	</div>
	<div class="float-card scan">
		<span class="float-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
				<path d="M7 12h10" />
			</svg>
		</span>
		<span>{copy.scanModes}</span>
	</div>
	<div class="float-card neutral">
		<span class="float-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
				<path d="M3 9l2-4h14l2 4" />
			</svg>
		</span>
		<span>{copy.storeNeutral}</span>
	</div>
</div>

<style>
	.visual {
		position: relative;
		width: min(100%, 26rem);
		margin-inline: auto;
		padding: var(--space-md);
	}

	.glow {
		position: absolute;
		inset: 10% 5% 20%;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in srgb, var(--color-primary) 22%, transparent),
			transparent 70%
		);
		filter: blur(24px);
		pointer-events: none;
	}

	.phone {
		position: relative;
		border-radius: calc(var(--radius-lg) + 4px);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.phone-notch {
		position: absolute;
		top: 0.65rem;
		left: 50%;
		transform: translateX(-50%);
		width: 3.5rem;
		height: 0.35rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
	}

	.phone-top {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: var(--space-sm);
	}

	.chip {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--chip) 35%, var(--color-border));
		color: var(--chip);
		background: color-mix(in srgb, var(--chip) 10%, var(--color-surface));
	}

	.chip.fridge {
		--chip: var(--color-fridge);
	}
	.chip.freezer {
		--chip: var(--color-freezer);
	}
	.chip.cupboard {
		--chip: var(--color-cupboard);
	}

	.eat-first {
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface-muted));
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, var(--color-border));
	}

	.eat-badge {
		display: inline-block;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-accent) 85%, var(--color-text));
	}

	.eat-copy {
		margin: var(--space-xs) 0 0;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.items {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.items li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--color-primary);
	}

	.dot.fridge {
		background: var(--color-fridge);
	}
	.dot.freezer {
		background: var(--color-freezer);
	}
	.dot.cupboard {
		background: var(--color-cupboard);
	}

	.line {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-text) 12%, var(--color-border));
	}

	.line.wide {
		width: 85%;
	}
	.line.mid {
		width: 65%;
	}

	.date {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.date.warn {
		color: var(--color-danger);
	}
	.date.ok {
		color: var(--color-primary);
	}

	.list-preview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
		border-top: 1px dashed var(--color-border);
	}

	.list-label {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
	}

	.list-pill {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
	}

	.float-card {
		position: absolute;
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 0.45rem 0.75rem;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.float-card.scan {
		top: 8%;
		right: -4%;
	}

	.float-card.neutral {
		bottom: 6%;
		left: -6%;
	}

	.float-icon {
		display: inline-flex;
		width: 1.1rem;
		height: 1.1rem;
		color: var(--color-primary);
	}

	.float-icon svg {
		width: 100%;
		height: 100%;
	}

	@media (min-width: 960px) {
		.visual {
			margin-inline: 0;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.phone {
			animation: float-phone 6s ease-in-out infinite;
		}

		.float-card.scan {
			animation: float-card-a 5s ease-in-out infinite;
		}

		.float-card.neutral {
			animation: float-card-b 5.5s ease-in-out infinite 0.4s;
		}
	}

	@keyframes float-phone {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}

	@keyframes float-card-a {
		0%,
		100% {
			transform: translateY(0) rotate(-1deg);
		}
		50% {
			transform: translateY(-4px) rotate(0deg);
		}
	}

	@keyframes float-card-b {
		0%,
		100% {
			transform: translateY(0) rotate(1deg);
		}
		50% {
			transform: translateY(5px) rotate(0deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.phone,
		.float-card {
			animation: none;
		}
	}
</style>
