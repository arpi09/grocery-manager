<script lang="ts">
	/** Direction-aware screen transition wrapper for onboarding v8 steps */

	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicIn, cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';

	interface Props {
		stepIndex: number;
		children: Snippet;
	}

	let { stepIndex, children }: Props = $props();

	/* Track previous index in a plain let — mutated inside the $derived closure
	   (not $state, so no invalidation loop); recomputes once per stepIndex change. */
	let prev = stepIndex;
	const direction = $derived.by(() => {
		const dir = stepIndex >= prev ? 1 : -1;
		prev = stepIndex;
		return dir;
	});

	/* 240 = --motion-duration-normal, 150 = --motion-duration-fast (ms) */
	const dur = (ms: number) => (prefersReducedMotion.current ? 0 : ms);
</script>

<div class="step-stage">
	{#key stepIndex}
		<div
			class="step"
			in:fly={{ x: 32 * direction, duration: dur(240), delay: dur(90), easing: cubicOut }}
			out:fly={{ x: -24 * direction, duration: dur(150), easing: cubicIn }}
		>
			{@render children()}
		</div>
	{/key}
</div>

<style>
	.step-stage {
		display: grid;
		overflow: clip;
	}

	/* Both screens share grid cell 1/1 during the crossfade — zero layout shift */
	.step {
		grid-area: 1 / 1;
		min-width: 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
</style>
