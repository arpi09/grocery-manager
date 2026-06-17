<script lang="ts">
	import type { ReceiptLocationCounts } from '$lib/utils/receipt-import-session';
	import { LOCATION_COLORS } from '$lib/domain/location';

	interface Props {
		counts: ReceiptLocationCounts;
	}

	let { counts }: Props = $props();

	const maxVisiblePerColumn = 8;

	function visibleCount(count: number, total: number): number {
		if (total <= 0) return 0;
		return Math.max(1, Math.min(maxVisiblePerColumn, Math.round((count / total) * maxVisiblePerColumn)));
	}

	const total = $derived(counts.cupboard + counts.fridge + counts.freezer);
	const cupboardVisible = $derived(visibleCount(counts.cupboard, total));
	const fridgeVisible = $derived(visibleCount(counts.fridge, total));
	const freezerVisible = $derived(visibleCount(counts.freezer, total));
</script>

<svg class="illus" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
	<g class="shelf-group cupboard">
		<rect class="shelf-frame" x="16" y="24" width="64" height="112" rx="8" />
		<line class="shelf-line" x1="24" y1="56" x2="72" y2="56" />
		<line class="shelf-line" x1="24" y1="96" x2="72" y2="96" />
		{#each Array.from({ length: cupboardVisible }, (_, index) => index) as index (index)}
			<rect class="product" style="--delay: {index * 60}ms; --color: {LOCATION_COLORS.cupboard}" x={24 + (index % 2) * 22} y={index < 4 ? 36 - index * 2 : 76 - (index - 4) * 2} width="18" height="14" rx="3" />
		{/each}
	</g>
	<g class="shelf-group fridge">
		<rect class="shelf-frame" x="88" y="24" width="64" height="112" rx="8" />
		<line class="shelf-line" x1="96" y1="56" x2="144" y2="56" />
		<line class="shelf-line" x1="96" y1="96" x2="144" y2="96" />
		{#each Array.from({ length: fridgeVisible }, (_, index) => index) as index (index)}
			<rect class="product" style="--delay: {120 + index * 60}ms; --color: {LOCATION_COLORS.fridge}" x={96 + (index % 2) * 22} y={index < 4 ? 36 - index * 2 : 76 - (index - 4) * 2} width="18" height="14" rx="3" />
		{/each}
		<path class="checkmark" d="M108 78 L118 88 L132 68" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
	</g>
	<g class="shelf-group freezer">
		<rect class="shelf-frame" x="160" y="24" width="64" height="112" rx="8" />
		<line class="shelf-line" x1="168" y1="56" x2="216" y2="56" />
		<line class="shelf-line" x1="168" y1="96" x2="216" y2="96" />
		{#each Array.from({ length: freezerVisible }, (_, index) => index) as index (index)}
			<rect class="product" style="--delay: {240 + index * 60}ms; --color: {LOCATION_COLORS.freezer}" x={168 + (index % 2) * 22} y={index < 4 ? 36 - index * 2 : 76 - (index - 4) * 2} width="18" height="14" rx="3" />
		{/each}
	</g>
</svg>

<style>
	.illus { width: min(100%, 15rem); height: auto; }
	.shelf-group { opacity: 0; transform: translateY(6px); animation: shelf-in 420ms cubic-bezier(0.33, 1, 0.68, 1) forwards; }
	.cupboard { animation-delay: 0ms; }
	.fridge { animation-delay: 80ms; }
	.freezer { animation-delay: 160ms; }
	.shelf-frame { fill: color-mix(in srgb, var(--color-surface-muted) 80%, transparent); stroke: var(--color-border); stroke-width: 1.5; }
	.shelf-line { stroke: var(--color-border); stroke-width: 1.5; }
	.product { fill: color-mix(in srgb, var(--color) 28%, var(--color-surface)); stroke: var(--color); stroke-width: 1.5; opacity: 0; transform: translateY(8px); animation: product-in 360ms cubic-bezier(0.33, 1, 0.68, 1) forwards; animation-delay: var(--delay); }
	.checkmark { fill: none; stroke-dasharray: 40; stroke-dashoffset: 40; animation: check-draw 400ms cubic-bezier(0.33, 1, 0.68, 1) 720ms forwards; }
	@keyframes shelf-in { to { opacity: 1; transform: translateY(0); } }
	@keyframes product-in { to { opacity: 1; transform: translateY(0); } }
	@keyframes check-draw { to { stroke-dashoffset: 0; } }
	@media (prefers-reduced-motion: reduce) {
		.shelf-group, .product { opacity: 1; transform: none; animation: none; }
		.checkmark { stroke-dashoffset: 0; animation: none; }
	}
</style>
