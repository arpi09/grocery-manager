<script lang="ts">

	import type { Snippet } from 'svelte';



	interface Props {

		children: Snippet;

	}



	let { children }: Props = $props();

</script>



<div class="page-container">

	{@render children()}

</div>



<style>

	.page-container {

		display: flex;

		flex-direction: column;

		gap: var(--page-section-gap);

		width: 100%;

		max-width: var(--page-max-width);

		min-width: 0;

		margin-inline: auto;

	}

</style>


