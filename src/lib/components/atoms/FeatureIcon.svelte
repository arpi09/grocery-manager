<script lang="ts">
	export type FeatureIconId =
		| 'barcode'
		| 'receipt'
		| 'photo'
		| 'box'
		| 'sparkle'
		| 'fridge'
		| 'freezer'
		| 'cupboard'
		| 'home'
		| 'users'
		| 'check';

	interface Props {
		id: FeatureIconId;
		size?: number;
	}

	let { id, size = 24 }: Props = $props();
</script>

<svg
	class="feature-icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if id === 'barcode'}
		<path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
		<path d="M4 19v-2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
		<path d="M7 9v6M10 9v6M13 9v3M16 9v6" />
	{:else if id === 'receipt'}
		<path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" />
		<path d="M9 7h6M9 11h6M9 15h4" />
	{:else if id === 'photo'}
		<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
		<circle cx="9" cy="10" r="1.5" />
		<path d="m20 15-3.5-3.5a1 1 0 0 0-1.4 0L8 19" />
	{:else if id === 'box'}
		<path d="M12 3 20 7v10l-8 4-8-4V7l8-4Z" />
		<path d="m12 3 8 5M12 3 4 7M12 3v8" />
	{:else if id === 'sparkle'}
		<path d="M12 3 13.5 8.5 19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" />
		<path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14Z" />
	{:else if id === 'fridge'}
		<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
		<path d="M7 11h10M9 7v2M9 15v2" />
	{:else if id === 'freezer'}
		<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
		<path d="M7 9h10M9 13h6" />
	{:else if id === 'cupboard'}
		<path d="M5 5h14v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5Z" />
		<path d="M5 11h14M12 5v15" />
	{:else if id === 'home'}
		<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
	{:else if id === 'users'}
		<circle cx="9" cy="8" r="3" />
		<path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
		<circle cx="17" cy="9" r="2.25" />
		<path d="M15 19c.3-2.2 1.8-3.5 4-3.5" />
	{:else if id === 'check'}
		<path d="M20 6 9 17l-5-5" />
	{/if}
</svg>

<style>
	.feature-icon {
		display: block;
		flex-shrink: 0;
	}
</style>
