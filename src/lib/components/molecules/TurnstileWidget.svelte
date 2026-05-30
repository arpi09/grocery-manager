<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		siteKey: string;
		labelledBy?: string;
	}

	let { siteKey, labelledBy }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let widgetId: string | undefined;

	function removeWidget() {
		if (widgetId && window.turnstile) {
			window.turnstile.remove(widgetId);
			widgetId = undefined;
		}
	}

	onMount(() => {
		if (!browser || !siteKey || !container) {
			return;
		}

		const renderWidget = () => {
			if (!container || !window.turnstile) {
				return;
			}
			removeWidget();
			widgetId = window.turnstile.render(container, {
				sitekey: siteKey,
				theme: 'auto',
				size: 'flexible'
			});
		};

		if (window.turnstile) {
			renderWidget();
			return removeWidget;
		}

		const scriptId = 'cf-turnstile-script';
		let script = document.getElementById(scriptId) as HTMLScriptElement | null;

		if (!script) {
			script = document.createElement('script');
			script.id = scriptId;
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		}

		script.addEventListener('load', renderWidget);
		if (window.turnstile) {
			renderWidget();
		}

		return () => {
			script?.removeEventListener('load', renderWidget);
			removeWidget();
		};
	});
</script>

<div
	bind:this={container}
	class="turnstile"
	aria-label={labelledBy ? undefined : t('auth.register.captchaLabel')}
	aria-labelledby={labelledBy}
></div>

<style>
	.turnstile {
		margin-bottom: var(--space-md);
		min-height: 65px;
		width: 100%;
	}
</style>
