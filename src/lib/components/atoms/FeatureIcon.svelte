<script lang="ts">
	import type { Component } from 'svelte';
	import type { IconProps } from '@lucide/svelte';
	import {
		Barcode,
		Boxes,
		Camera,
		Check,
		House,
		Package,
		Receipt,
		Refrigerator,
		ShoppingCart,
		Snowflake,
		Sparkles,
		Users
	} from '@lucide/svelte';

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
		| 'check'
		| 'shopping';

	interface Props {
		id: FeatureIconId;
		size?: number;
	}

	let { id, size = 24 }: Props = $props();

	const iconComponents: Record<FeatureIconId, Component<IconProps>> = {
		barcode: Barcode,
		receipt: Receipt,
		photo: Camera,
		box: Package,
		sparkle: Sparkles,
		fridge: Refrigerator,
		freezer: Snowflake,
		cupboard: Boxes,
		home: House,
		users: Users,
		check: Check,
		shopping: ShoppingCart
	};

	const Icon = $derived(iconComponents[id]);
</script>

<Icon class="feature-icon" {size} strokeWidth={2} aria-hidden="true" />

<style>
	:global(.feature-icon) {
		display: block;
		flex-shrink: 0;
	}
</style>
