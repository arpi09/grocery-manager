<script lang="ts">
	/** Inline confirmation check shown when a setup action succeeds */

	interface Props {
		size?: number;
	}

	let { size = 20 }: Props = $props();
</script>

<span class="setup-check" style="--check-size: {size}px" aria-hidden="true">
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle class="ring" cx="12" cy="12" r="10" stroke-width="2" />
		<path
			class="check"
			d="M7 12.5 L10.5 16 L17 8.5"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</span>

<style>
	.setup-check {
		display: inline-flex;
		width: var(--check-size);
		height: var(--check-size);
		flex-shrink: 0;
	}

	svg {
		width: 100%;
		height: 100%;
	}

	.ring {
		stroke: var(--color-success);
		fill: none;
		transform-origin: 12px 12px;
		animation: ring-pop 0.55s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
	}

	.check {
		stroke: var(--color-success);
		fill: none;
		stroke-dasharray: 60;
		stroke-dashoffset: 60;
		animation: check-draw 0.45s 0.25s var(--motion-ease-out) forwards;
	}

	@keyframes ring-pop {
		from {
			opacity: 0;
			transform: scale(0);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes check-draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ring,
		.check {
			animation: none;
			opacity: 1;
			stroke-dashoffset: 0;
			transform: none;
		}
	}
</style>
