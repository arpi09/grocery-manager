<script lang="ts">
	import { navigating } from '$app/state';
	import { isNavigationActive } from '$lib/navigation/is-navigation-active';

	const SHOW_DELAY_MS = 175;
	const MIN_VISIBLE_MS = 300;

	let visible = $state(false);

	let delayTimer: ReturnType<typeof setTimeout> | undefined;
	let minVisibleTimer: ReturnType<typeof setTimeout> | undefined;
	let shownAt = 0;
	let pendingHide = false;

	const isNavigating = $derived(isNavigationActive(navigating));

	function clearDelayTimer() {
		clearTimeout(delayTimer);
		delayTimer = undefined;
	}

	function clearMinVisibleTimer() {
		clearTimeout(minVisibleTimer);
		minVisibleTimer = undefined;
	}

	function hideBar() {
		visible = false;
		shownAt = 0;
		pendingHide = false;
		clearMinVisibleTimer();
	}

	function showBar() {
		visible = true;
		shownAt = Date.now();
		pendingHide = false;
	}

	function scheduleHide() {
		if (!visible) {
			hideBar();
			return;
		}

		const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
		if (remaining === 0) {
			hideBar();
			return;
		}

		pendingHide = true;
		clearMinVisibleTimer();
		minVisibleTimer = setTimeout(() => {
			minVisibleTimer = undefined;
			if (pendingHide) {
				hideBar();
			}
		}, remaining);
	}

	$effect(() => {
		if (isNavigating) {
			pendingHide = false;
			clearMinVisibleTimer();

			if (!visible && delayTimer === undefined) {
				delayTimer = setTimeout(() => {
					delayTimer = undefined;
					if (isNavigationActive(navigating)) {
						showBar();
					}
				}, SHOW_DELAY_MS);
			}
			return;
		}

		clearDelayTimer();

		if (visible) {
			scheduleHide();
		} else {
			pendingHide = false;
		}
	});

	$effect(() => () => {
		clearDelayTimer();
		clearMinVisibleTimer();
	});
</script>

{#if visible}
	<div class="navigation-progress" aria-hidden="false">
		<div
			class="navigation-progress__track"
			role="progressbar"
			aria-valuetext="Loading"
			aria-busy="true"
		>
			<div class="navigation-progress__bar"></div>
		</div>
	</div>
{/if}

<style>
	.navigation-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10000;
		pointer-events: none;
	}

	.navigation-progress__track {
		height: 3px;
		width: 100%;
		overflow: hidden;
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	.navigation-progress__bar {
		height: 100%;
		width: 40%;
		background: var(--color-primary);
		transform: translateX(-100%);
		animation: navigation-progress-slide 1.1s ease-in-out infinite;
	}

	@keyframes navigation-progress-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(350%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navigation-progress__bar {
			width: 100%;
			transform: none;
			animation: navigation-progress-pulse 1.4s ease-in-out infinite;
		}

		@keyframes navigation-progress-pulse {
			0%,
			100% {
				opacity: 0.45;
			}
			50% {
				opacity: 1;
			}
		}
	}
</style>
