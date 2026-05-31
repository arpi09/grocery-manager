<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		siteKey: string;
		labelledBy?: string;
	}

	let { siteKey, labelledBy }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let loadFailed = $state(false);
	let widgetId: string | undefined;

	const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
	const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	function removeWidget() {
		if (widgetId && window.turnstile) {
			window.turnstile.remove(widgetId);
			widgetId = undefined;
		}
	}

	function markLoadFailed() {
		loadFailed = true;
	}

	$effect(() => {
		if (!browser || !siteKey || !container) {
			return;
		}

		let cancelled = false;

		const renderWidget = () => {
			if (cancelled || !container || !window.turnstile) {
				return;
			}
			removeWidget();
			loadFailed = false;
			widgetId = window.turnstile.render(container, {
				sitekey: siteKey,
				theme: 'auto',
				size: 'flexible',
				callback: () => {
					loadFailed = false;
				},
				'expired-callback': () => {
					if (widgetId && window.turnstile) {
						window.turnstile.reset(widgetId);
					}
				},
				'error-callback': (code) => {
					console.warn(`[turnstile] Widget error: ${code ?? 'unknown'}`);
					loadFailed = true;
				}
			});
		};

		const onScriptLoad = () => {
			if (window.turnstile?.ready) {
				window.turnstile.ready(renderWidget);
				return;
			}
			renderWidget();
		};

		if (window.turnstile) {
			onScriptLoad();
			return () => {
				cancelled = true;
				removeWidget();
			};
		}

		let script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

		if (!script) {
			script = document.createElement('script');
			script.id = TURNSTILE_SCRIPT_ID;
			script.src = TURNSTILE_SCRIPT_SRC;
			script.async = true;
			script.defer = true;
			script.addEventListener('error', markLoadFailed);
			document.head.appendChild(script);
		}

		script.addEventListener('load', onScriptLoad);
		if (window.turnstile) {
			onScriptLoad();
		}

		return () => {
			cancelled = true;
			script?.removeEventListener('load', onScriptLoad);
			script?.removeEventListener('error', markLoadFailed);
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
{#if loadFailed}
	<p class="load-error" role="alert">{t('auth.register.captchaLoadError')}</p>
{/if}

<style>
	.turnstile {
		margin-bottom: var(--space-md);
		min-height: 65px;
		width: 100%;
	}

	.load-error {
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-danger, #b42318);
	}
</style>
