<script lang="ts">
	import type { NavIconId } from '$lib/navigation/nav-config';

	interface Props {
		id: NavIconId;
	}

	let { id }: Props = $props();
</script>

<svg
	class="nav-icon"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if id === 'home'}
		<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
	{:else if id === 'inventory'}
		<path d="M5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7Z" />
		<path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
		<path d="M5 11h14" />
	{:else if id === 'shopping'}
		<path d="M6 6h15l-1.5 9h-11L6 6Z" />
		<path d="M6 6 5 3H2" />
		<circle cx="9" cy="20" r="1" />
		<circle cx="18" cy="20" r="1" />
	{:else if id === 'calendar'}
		<rect x="4" y="5" width="16" height="16" rx="2" />
		<path d="M8 3v4M16 3v4M4 11h16" />
	{:else if id === 'chart'}
		<path d="M4 19V5M4 19h16" />
		<path d="M8 17V11M12 17V7M16 17v-4" />
	{:else if id === 'settings'}
		<circle cx="12" cy="12" r="3" />
		<path
			d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
		/>
	{:else if id === 'paw'}
		<ellipse cx="8" cy="8.5" rx="1.6" ry="2" />
		<ellipse cx="12" cy="7" rx="1.6" ry="2" />
		<ellipse cx="16" cy="8.5" rx="1.6" ry="2" />
		<path d="M7 11.5c1.2 3 2.8 4.5 5 4.5s3.8-1.5 5-4.5" />
	{:else if id === 'shield'}
		<path d="M12 3 5 6v6c0 4.2 3 7.4 7 8 4-0.6 7-3.8 7-8V6l-7-3Z" />
	{:else if id === 'more'}
		<circle cx="6" cy="12" r="1.25" fill="currentColor" stroke="none" />
		<circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
		<circle cx="18" cy="12" r="1.25" fill="currentColor" stroke="none" />
	{/if}
</svg>

<style>
	.nav-icon {
		display: block;
		flex-shrink: 0;
	}
</style>
