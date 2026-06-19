<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<svg
	class="filter-list-icon {className}"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="currentColor"
	aria-hidden="true"
>
	<path d="M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z" />
</svg>

<style>
	.filter-list-icon {
		display: block;
		flex-shrink: 0;
	}
</style>
