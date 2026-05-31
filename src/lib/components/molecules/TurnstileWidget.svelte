<script lang="ts">
	import { browser } from '$app/environment';
	import { createTurnstileMount } from '$lib/client/turnstile-mount';
	import { getTurnstileLoadErrorMessageKey } from '$lib/domain/turnstile-errors';
	import { t } from '$lib/i18n';

	interface Props {
		siteKey: string;
		labelledBy?: string;
		loadFailed?: boolean;
	}

	let { siteKey, labelledBy, loadFailed = $bindable(false) }: Props = $props();

	let errorCode = $state<string | undefined>(undefined);

	const loadErrorMessage = $derived(t(getTurnstileLoadErrorMessageKey(errorCode)));

	function markLoadFailed(code?: string) {
		errorCode = code;
		loadFailed = true;
	}

	function turnstileMountAction(node: HTMLDivElement, key: string) {
		if (!browser) {
			return;
		}

		if (!key.trim()) {
			markLoadFailed('missing-key');
			return;
		}

		const callbacks = {
			onSuccess: () => {
				errorCode = undefined;
				loadFailed = false;
			},
			onError: markLoadFailed
		};

		let handle = createTurnstileMount(node, { siteKey: key, ...callbacks });

		return {
			update(newKey: string) {
				if (newKey === key) {
					return;
				}
				key = newKey;
				if (!newKey.trim()) {
					handle.destroy();
					markLoadFailed('missing-key');
					return;
				}
				handle.rerender({ siteKey: newKey, ...callbacks });
			},
			destroy() {
				handle.destroy();
			}
		};
	}
</script>

<div
	use:turnstileMountAction={siteKey}
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
