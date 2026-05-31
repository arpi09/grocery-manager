export const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
export const TURNSTILE_SCRIPT_SRC =
	'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const RENDER_CHECK_MS = 8_000;

let scriptLoadPromise: Promise<void> | null = null;

function whenTurnstileReady(): Promise<void> {
	return new Promise((resolve) => {
		if (window.turnstile?.ready) {
			window.turnstile.ready(resolve);
			return;
		}
		resolve();
	});
}

/** Load Cloudflare Turnstile once; safe to call from multiple widgets. */
export function loadTurnstileScript(): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.resolve();
	}

	if (window.turnstile) {
		return whenTurnstileReady();
	}

	if (scriptLoadPromise) {
		return scriptLoadPromise;
	}

	scriptLoadPromise = new Promise((resolve, reject) => {
		const finish = () => {
			whenTurnstileReady().then(resolve, reject);
		};

		const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

		if (existing) {
			if (window.turnstile) {
				finish();
				return;
			}
			existing.addEventListener('load', finish, { once: true });
			existing.addEventListener(
				'error',
				() => reject(new Error('turnstile script load failed')),
				{ once: true }
			);
			return;
		}

		const script = document.createElement('script');
		script.id = TURNSTILE_SCRIPT_ID;
		script.src = TURNSTILE_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.addEventListener('load', finish, { once: true });
		script.addEventListener(
			'error',
			() => reject(new Error('turnstile script load failed')),
			{ once: true }
		);
		document.head.appendChild(script);
	});

	return scriptLoadPromise;
}

export type TurnstileMountCallbacks = {
	siteKey: string;
	onSuccess?: () => void;
	onError?: (code?: string) => void;
};

export type TurnstileMountHandle = {
	destroy: () => void;
	rerender: (params: TurnstileMountCallbacks) => void;
};

export function createTurnstileMount(
	node: HTMLElement,
	params: TurnstileMountCallbacks
): TurnstileMountHandle {
	let widgetId: string | undefined;
	let cancelled = false;
	let renderCheckTimer: ReturnType<typeof setTimeout> | undefined;
	let currentParams = params;

	function clearRenderCheck() {
		if (renderCheckTimer) {
			clearTimeout(renderCheckTimer);
			renderCheckTimer = undefined;
		}
	}

	function removeWidget() {
		clearRenderCheck();
		if (widgetId && window.turnstile) {
			window.turnstile.remove(widgetId);
			widgetId = undefined;
		}
	}

	function scheduleRenderCheck() {
		clearRenderCheck();
		renderCheckTimer = setTimeout(() => {
			if (cancelled) {
				return;
			}
			const hasWidgetContent =
				node.querySelector('iframe') ||
				node.querySelector('input[name="cf-turnstile-response"]');
			if (!hasWidgetContent) {
				console.warn('[turnstile] Widget did not mount within timeout');
				currentParams.onError?.('timeout');
			}
		}, RENDER_CHECK_MS);
	}

	function renderWidget() {
		if (cancelled || !window.turnstile) {
			return;
		}

		const key = currentParams.siteKey.trim();
		if (!key) {
			currentParams.onError?.('missing-key');
			return;
		}

		removeWidget();

		try {
			widgetId = window.turnstile.render(node, {
				sitekey: key,
				theme: 'auto',
				size: 'flexible',
				callback: () => {
					clearRenderCheck();
					currentParams.onSuccess?.();
				},
				'expired-callback': () => {
					if (widgetId && window.turnstile) {
						window.turnstile.reset(widgetId);
					}
				},
				'error-callback': (code) => {
					clearRenderCheck();
					console.warn(`[turnstile] Widget error: ${code ?? 'unknown'}`);
					currentParams.onError?.(code);
				}
			});
			scheduleRenderCheck();
		} catch (error) {
			clearRenderCheck();
			const detail = error instanceof Error ? error.message : 'render failed';
			console.error(`[turnstile] render() threw: ${detail}`);
			currentParams.onError?.('render-failed');
		}
	}

	void loadTurnstileScript()
		.then(() => {
			if (!cancelled) {
				renderWidget();
			}
		})
		.catch(() => {
			if (!cancelled) {
				currentParams.onError?.();
			}
		});

	return {
		destroy() {
			cancelled = true;
			removeWidget();
		},
		rerender(nextParams: TurnstileMountCallbacks) {
			currentParams = nextParams;
			renderWidget();
		}
	};
}
