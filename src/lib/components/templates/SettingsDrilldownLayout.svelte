<script lang="ts">
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import { t } from '$lib/i18n';
	import type { ComponentProps } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		user: ComponentProps<typeof AppLayout>['user'];
		title: string;
		subtitle?: string;
		backLabel?: string;
		children: Snippet;
	}

	let { user, title, subtitle, backLabel, children }: Props = $props();
</script>

<AppLayout {user}>
	<AppHeader
		{title}
		{subtitle}
		backHref="/settings"
		backLabel={backLabel ?? t('memory.backToSettings')}
	/>
	<PageContainer>
		<div class="settings-drilldown">
			{@render children()}
		</div>
	</PageContainer>
</AppLayout>

<style>
	:global(.settings-drilldown .settings-section .section-header) {
		display: none;
	}
</style>
