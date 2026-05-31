<script lang="ts">
	import { browser } from '$app/environment';
	import { getTurnstileLoadErrorMessageKey } from '$lib/domain/turnstile-errors';
	import { t } from '$lib/i18n';

	interface Props {
		siteKey: string;
		labelledBy?: string;
		loadFailed?: boolean;
	}

	let { siteKey, labelledBy, loadFailed = $bindable(false) }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let errorCode = $state<string | undefined>(undefined);
	let widgetId: string | undefined;

	const loadErrorMessage = $derived(t(getTurnstileLoadErrorMessageKey(errorCode)));

	const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
	const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	function removeWidget() {
		if (widgetId && window.turnstile) {
			window.turnstile.remove(widgetId);
			widgetId = undefined;
		}
	}

	function markLoadFailed(code?: string) {
		errorCode = code;
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
			errorCode = undefined;
			widgetId = window.turnstile.render(container, {
				sitekey: siteKey,
				theme: 'auto',
				size: 'flexible',
				callback: () => {
					loadFailed = false;
					errorCode = undefined;
				},
				'expired-callback': () => {
					if (widgetId && window.turnstile) {
						window.turnstile.reset(widgetId);
					}
				},
				'error-callback': (code) => {
					console.warn(`[turnstile] Widget error: ${code ?? 'unknown'}`);
					markLoadFailed(code);
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
			script.addEventListener('error', () => markLoadFailed());
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
	<p class="load-error" role="alert" data-turnstile-error-code={errorCode ?? 'unknown'}>
		{loadErrorMessage}
		{#if import.meta.env.DEV && errorCode}
			<span class="debug-code"> ({errorCode})</span>
		{/if}
	</p>
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

	.debug-code {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
	}
</style>
