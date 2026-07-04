<svg class="illus" viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<path
		class="loop-path"
		d="M68 52 L172 52 Q188 52 178 64 L130 122 Q120 134 110 122 L62 64 Q52 52 68 52 Z"
		stroke-width="2"
		stroke-linecap="round"
	/>
	<circle class="dot" r="4" />
	<g class="station station-list">
		<rect class="card" x="32" y="28" width="40" height="50" rx="8" />
		<rect class="row r1" x="39" y="38" width="22" height="5" rx="2.5" />
		<rect class="row r2" x="39" y="50" width="26" height="5" rx="2.5" />
		<rect class="row r3" x="39" y="62" width="18" height="5" rx="2.5" />
	</g>
	<g class="station station-cart">
		<path class="cart-handle" d="M170 37 H176 L179 44" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
		<path class="cart-body" d="M177 44 H206 L202 57 H182 Z" stroke-linejoin="round" />
		<circle class="wheel" cx="186" cy="63" r="3.2" />
		<circle class="wheel" cx="198" cy="63" r="3.2" />
	</g>
	<g class="station station-shelf">
		<rect class="shelf" x="94" y="138" width="52" height="8" rx="4" />
		<rect class="jar" x="100" y="118" width="13" height="20" rx="4" />
		<rect class="jar" x="117" y="122" width="11" height="16" rx="3.5" />
		<rect class="jar" x="132" y="120" width="12" height="18" rx="3.5" />
	</g>
	<path class="spark" d="M120 93 L121.8 98.2 L127 100 L121.8 101.8 L120 107 L118.2 101.8 L113 100 L118.2 98.2 Z" />
</svg>

<style>
	.illus {
		display: block;
		width: 100%;
		height: auto;
		color: var(--color-primary);
	}

	.loop-path {
		stroke: color-mix(in srgb, var(--color-primary) 45%, transparent);
		stroke-dasharray: 5 9;
		stroke-dashoffset: 0;
		animation: dash-march 2.8s linear infinite;
	}

	.dot {
		display: none;
		fill: var(--color-primary);
	}

	@supports (offset-path: path('M0 0')) {
		.dot {
			display: block;
			offset-path: path('M68 52 L172 52 Q188 52 178 64 L130 122 Q120 134 110 122 L62 64 Q52 52 68 52 Z');
			offset-distance: 0%;
			animation: dot-travel 5.6s ease-in-out infinite;
		}
	}

	.station {
		transform-box: fill-box;
		transform-origin: center;
		animation:
			item-rise 480ms var(--motion-ease-out) both,
			station-pulse 5.6s ease-in-out infinite;
		animation-delay: 0ms, 5.6s;
	}

	.station-cart {
		animation-delay: 160ms, 7.47s;
	}

	.station-shelf {
		animation-delay: 320ms, 9.33s;
	}

	.card,
	.jar,
	.wheel,
	.cart-body {
		fill: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 2;
	}

	.row {
		fill: color-mix(in srgb, var(--color-primary) 32%, var(--color-surface));
	}

	.r2 {
		opacity: 0.75;
	}
	.r3 {
		opacity: 0.55;
	}

	.cart-handle {
		stroke: var(--color-primary);
	}

	.shelf {
		fill: color-mix(in srgb, var(--color-primary) 22%, var(--color-surface));
		stroke: none;
	}

	.spark {
		fill: var(--color-accent);
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation: spark-flash 600ms var(--motion-ease-out) 900ms forwards;
	}

	@keyframes item-rise {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes dash-march {
		to {
			stroke-dashoffset: -56;
		}
	}

	@keyframes dot-travel {
		to {
			offset-distance: 100%;
		}
	}

	@keyframes station-pulse {
		0%,
		12.5%,
		100% {
			transform: scale(1);
		}
		6.25% {
			transform: scale(1.04);
		}
	}

	@keyframes spark-flash {
		0% {
			opacity: 0;
			transform: scale(0.6) rotate(0deg);
		}
		45% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1.1) rotate(45deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.loop-path {
			animation: none;
			stroke-dashoffset: 0;
		}

		.dot {
			display: none;
		}

		.station {
			animation: none;
			opacity: 1;
			transform: none;
		}

		.spark {
			animation: none;
			opacity: 0.6;
			transform: none;
		}
	}
</style>
