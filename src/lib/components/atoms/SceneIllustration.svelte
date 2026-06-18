<script lang="ts">
	interface Props {
		src: string;
		ariaLabel?: string;
		decorative?: boolean;
		width?: number;
		height?: number;
	}

	let { src, ariaLabel, decorative = false, width = 280, height = 210 }: Props = $props();
</script>

<div
	class="scene-illus"
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : ariaLabel}
>
	<img {src} alt="" {width} {height} aria-hidden="true" />
</div>

<style>
	.scene-illus {
		display: flex;
		justify-content: center;
		border-radius: var(--radius-lg);
		overflow: hidden;
		opacity: 0.9;
	}

	.scene-illus img {
		width: min(100%, 100%);
		height: auto;
		aspect-ratio: 4 / 3;
		display: block;
	}
</style>
