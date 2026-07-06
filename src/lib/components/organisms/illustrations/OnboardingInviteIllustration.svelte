<svg class="illus" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<circle class="avatar a1" cx="66" cy="92" r="14" />
	<circle class="avatar a2" cx="134" cy="92" r="14" />
	<path class="link" d="M80 92 H120" stroke-width="2.5" stroke-linecap="round" />
	<path class="house" d="M88 68 L100 56 L112 68 V84 H88 Z" stroke-width="2" stroke-linejoin="round" />
</svg>

<style>
	.illus {
		width: min(100%, 12.5rem);
		height: auto;
		color: var(--color-primary);
	}

	.avatar {
		fill: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		stroke: var(--color-primary);
		stroke-width: 2;
		animation: avatar-glide-left 420ms var(--motion-ease-out) both;
	}

	.a2 {
		animation-name: avatar-glide-right;
		animation-delay: 120ms;
	}

	.link {
		stroke: var(--color-primary);
		stroke-dasharray: 40;
		stroke-dashoffset: 40;
		animation: path-draw 700ms ease forwards 300ms;
	}

	.house {
		fill: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface));
		stroke: var(--color-primary);
		opacity: 0;
		transform: scale(0);
		transform-origin: 100px 70px;
		animation: house-pop 550ms 800ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
	}

	@keyframes avatar-glide-left {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes avatar-glide-right {
		from {
			opacity: 0;
			transform: translateX(10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes path-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes house-pop {
		from {
			opacity: 0;
			transform: scale(0);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.avatar,
		.link,
		.house {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
