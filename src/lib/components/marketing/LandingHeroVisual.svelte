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
		<header class="phone-header">
			<span class="list-title">{copy.listTitle}</span>
			<span class="member-avatars" title="Household members">{copy.memberAvatars}</span>
		</header>
		<ul class="list-items">
			<li class="checked">
				<span class="check" aria-hidden="true">✓</span>
				<span class="item-name checked-name">{copy.listItemChecked}</span>
			</li>
			<li class="suggestion">
				<span class="suggestion-icon" aria-hidden="true">✦</span>
				<div class="suggestion-body">
					<span class="item-name suggestion-text">{copy.suggestionText}</span>
					<span class="suggestion-badge">{copy.suggestionBadge}</span>
				</div>
			</li>
			<li>
				<span class="check empty" aria-hidden="true"></span>
				<span class="item-name">{copy.listItemPending}</span>
			</li>
			<li>
				<span class="check empty" aria-hidden="true"></span>
				<span class="item-name">{copy.listItemPending2}</span>
			</li>
		</ul>
		<div class="eat-first">
			<span class="eat-badge">{copy.eatFirstBadge}</span>
			<p class="eat-copy">{copy.eatFirstCaption}</p>
		</div>
	</div>
	<div class="float-card share">
		<span class="float-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
				<polyline points="16 6 12 2 8 6" />
				<line x1="12" y1="2" x2="12" y2="15" />
			</svg>
		</span>
		<span>{copy.shareLink}</span>
	</div>
	<div class="float-card together">
		<span class="float-icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
				<path d="M16 3.13a4 4 0 0 1 0 7.75" />
			</svg>
		</span>
		<span>{copy.shopTogether}</span>
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

	@media (prefers-reduced-motion: no-preference) {
		.glow {
			animation: glow-pulse 2.4s ease-in-out infinite;
		}
	}

	@keyframes glow-pulse {
		0%,
		100% {
			opacity: 0.65;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.04);
		}
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

	.phone-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.list-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.member-avatars {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.25rem;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
	}

	.list-items {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.list-items li {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.list-items li.checked {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
	}

	.list-items li.suggestion {
		grid-template-columns: auto 1fr;
		background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-muted));
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
	}

	.suggestion-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.1rem;
		font-size: 0.75rem;
		color: var(--color-primary);
	}

	.suggestion-body {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs) var(--space-sm);
	}

	.suggestion-text {
		font-weight: 600;
	}

	.suggestion-badge {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
	}

	.check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.check.empty {
		background: transparent;
		border: 2px solid var(--color-border);
	}

	.item-name {
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.checked-name {
		color: var(--color-text-muted);
		text-decoration: line-through;
		font-weight: 500;
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
		color: var(--color-primary);
	}

	.eat-copy {
		margin: var(--space-xs) 0 0;
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		color: var(--color-text);
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

	.float-card.share {
		top: 8%;
		right: -4%;
	}

	.float-card.together {
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

		.float-card.share {
			animation: float-card-a 5s ease-in-out infinite;
		}

		.float-card.together {
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

		.glow {
			animation: none;
		}
	}
</style>
