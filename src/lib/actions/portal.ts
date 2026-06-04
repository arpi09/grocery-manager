import type { Action } from 'svelte/action';

export const portal: Action<HTMLElement, HTMLElement | string | undefined> = (
	node,
	target = 'body'
) => {
	// Portals attach to <html>, not <body>, so scroll-lock (body position:fixed) cannot
	// break viewport-fixed modal positioning on iOS Safari.
	const host =
		typeof target === 'string'
			? target === 'body'
				? document.documentElement
				: document.querySelector<HTMLElement>(target)
			: target;
	if (!host) {
		return;
	}

	host.appendChild(node);

	return {
		destroy() {
			node.remove();
		}
	};
};
