<script lang="ts">
	/** Visual product story for the login landing — icons + CSS mock panels only. */
	const features = [
		{ id: 'fridge', label: 'Kyl', color: 'var(--color-fridge)' },
		{ id: 'freezer', label: 'Frys', color: 'var(--color-freezer)' },
		{ id: 'cupboard', label: 'Skafferi', color: 'var(--color-cupboard)' },
		{ id: 'expiry', label: 'Utgår snart', color: 'var(--color-accent)' },
		{ id: 'shopping', label: 'Inköpslista', color: 'var(--color-primary)' },
		{ id: 'scan', label: 'Skanna', color: 'var(--color-primary)' },
		{ id: 'household', label: 'Hushåll', color: 'var(--color-text-muted)' }
	] as const;
</script>

<div class="showcase" aria-hidden="true">
	<p class="headline">Ditt skafferi, samlat</p>

	<div class="mobile-strip">
		<span class="strip-item" style="--strip: var(--color-fridge)">Kyl</span>
		<span class="strip-item" style="--strip: var(--color-freezer)">Frys</span>
		<span class="strip-item" style="--strip: var(--color-cupboard)">Skafferi</span>
		<span class="strip-item" style="--strip: var(--color-accent)">Datum</span>
		<span class="strip-item" style="--strip: var(--color-primary)">Inköp</span>
	</div>

	<div class="bento">
		<div class="mock mock-pantry">
			<div class="mock-header">
				<span class="mock-dot"></span>
				<span class="mock-line"></span>
			</div>
			<ul class="shelves">
				<li>
					<span class="pill" style="--pill: var(--color-fridge)"></span>
					<span class="pill wide" style="--pill: var(--color-cupboard)"></span>
					<span class="expiry warn"></span>
				</li>
				<li>
					<span class="pill" style="--pill: var(--color-freezer)"></span>
					<span class="pill" style="--pill: var(--color-primary)"></span>
				</li>
				<li>
					<span class="pill wide" style="--pill: var(--color-accent)"></span>
					<span class="expiry ok"></span>
				</li>
			</ul>
		</div>

		<div class="mock mock-expiry">
			<span class="expiry-ring" aria-hidden="true"></span>
			<span class="mock-caption">3 snart</span>
		</div>

		{#each features as feature (feature.id)}
			<div class="tile" data-id={feature.id}>
				<span class="tile-icon" style="--tile: {feature.color}">
					{#if feature.id === 'fridge'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<rect x="5" y="3" width="14" height="18" rx="2" />
							<path d="M5 9h14M9 13h2v4H9z" />
						</svg>
					{:else if feature.id === 'freezer'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<rect x="5" y="4" width="14" height="16" rx="2" />
							<path d="M8 8h8M8 12h8M8 16h5" />
						</svg>
					{:else if feature.id === 'cupboard'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7Z" />
							<path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 11h14" />
						</svg>
					{:else if feature.id === 'expiry'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="12" cy="12" r="8" />
							<path d="M12 8v4l3 2" />
						</svg>
					{:else if feature.id === 'shopping'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M6 6h15l-1.5 9h-11L6 6Z" />
							<circle cx="9" cy="20" r="1" />
							<circle cx="18" cy="20" r="1" />
						</svg>
					{:else if feature.id === 'scan'}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
							<path d="M7 12h10" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
							<circle cx="17" cy="11" r="2.5" />
							<path d="M17 13.5v2" />
						</svg>
					{/if}
				</span>
				<span class="tile-label">{feature.label}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.showcase {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.mobile-strip {
		display: none;
	}

	@media (max-width: 899px) {
		.showcase {
			gap: var(--space-sm);
			align-items: center;
		}

		.headline {
			font-size: 0.8125rem;
			font-weight: 600;
			letter-spacing: -0.01em;
			color: var(--color-text-muted);
			text-align: center;
		}

		.bento {
			display: none;
		}

		.mobile-strip {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.35rem;
		}

		.strip-item {
			font-size: 0.65rem;
			font-weight: 600;
			padding: 0.2rem 0.55rem;
			border-radius: 999px;
			color: var(--strip);
			background: color-mix(in srgb, var(--strip) 12%, var(--color-surface));
			border: 1px solid color-mix(in srgb, var(--strip) 28%, var(--color-border));
		}
	}

	.headline {
		margin: 0;
		font-size: clamp(1.75rem, 5vw, 2.35rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.1;
		color: var(--color-text);
	}

	.bento {
		display: grid;
		gap: var(--space-sm);
		grid-template-columns: repeat(3, 1fr);
		grid-template-areas:
			'pantry pantry expiry'
			'fridge freezer shopping'
			'scan scan household';
	}

	.mock {
		background: color-mix(in srgb, var(--color-surface) 88%, transparent);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		box-shadow: var(--shadow-sm);
	}

	.mock-pantry {
		grid-area: pantry;
		min-height: 7.5rem;
	}

	.mock-expiry {
		grid-area: expiry;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface));
	}

	.mock-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.mock-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--color-primary);
	}

	.mock-line {
		flex: 1;
		height: 0.35rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
	}

	.shelves {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.shelves li {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding-top: var(--space-xs);
		border-top: 1px dashed color-mix(in srgb, var(--color-border) 80%, transparent);
	}

	.pill {
		display: block;
		width: 1.75rem;
		height: 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--pill) 55%, var(--color-surface-muted));
	}

	.pill.wide {
		width: 2.75rem;
	}

	.expiry {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		margin-left: auto;
		flex-shrink: 0;
	}

	.expiry.warn {
		background: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 35%, transparent);
	}

	.expiry.ok {
		background: var(--color-primary);
	}

	.expiry-ring {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		border: 3px solid color-mix(in srgb, var(--color-accent) 45%, transparent);
		border-top-color: var(--color-accent);
		transform: rotate(-24deg);
	}

	.mock-caption {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		letter-spacing: 0.02em;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: var(--space-sm) var(--space-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-sm);
		min-height: 4.25rem;
	}

	.tile[data-id='fridge'] {
		grid-area: fridge;
	}
	.tile[data-id='freezer'] {
		grid-area: freezer;
	}
	.tile[data-id='cupboard'] {
		display: none;
	}
	.tile[data-id='expiry'] {
		display: none;
	}
	.tile[data-id='shopping'] {
		grid-area: shopping;
	}
	.tile[data-id='scan'] {
		grid-area: scan;
	}
	.tile[data-id='household'] {
		grid-area: household;
	}

	.tile-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--tile) 14%, var(--color-surface-muted));
		color: var(--tile);
	}

	.tile-icon svg {
		width: 1.15rem;
		height: 1.15rem;
		stroke: currentColor;
		fill: none;
		stroke-width: 1.65;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.tile-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.2;
	}

	@media (min-width: 480px) {
		.bento {
			grid-template-areas:
				'pantry pantry expiry'
				'fridge freezer cupboard'
				'shopping scan household';
		}

		.tile[data-id='cupboard'] {
			display: flex;
			grid-area: cupboard;
		}
	}

	@media (min-width: 900px) {
		.bento {
			gap: var(--space-md);
		}

		.mock-pantry {
			min-height: 9rem;
		}

		.tile {
			min-height: 4.75rem;
		}

		.tile-icon {
			width: 2.25rem;
			height: 2.25rem;
		}

		.tile-icon svg {
			width: 1.35rem;
			height: 1.35rem;
		}

		.tile-label {
			font-size: 0.7rem;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.expiry-ring {
			animation: pulse-ring 4s ease-in-out infinite;
		}

		.mock-pantry .pill {
			animation: shelf-in 0.6s ease-out backwards;
		}

		.mock-pantry .shelves li:nth-child(1) .pill {
			animation-delay: 0.05s;
		}
		.mock-pantry .shelves li:nth-child(2) .pill {
			animation-delay: 0.12s;
		}
		.mock-pantry .shelves li:nth-child(3) .pill {
			animation-delay: 0.19s;
		}
	}

	@keyframes pulse-ring {
		0%,
		100% {
			transform: rotate(-24deg) scale(1);
		}
		50% {
			transform: rotate(12deg) scale(1.04);
		}
	}

	@keyframes shelf-in {
		from {
			opacity: 0;
			transform: translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.expiry-ring,
		.mock-pantry .pill {
			animation: none;
		}
	}
</style>
