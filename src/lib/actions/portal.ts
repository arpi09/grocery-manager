import type { Action } from 'svelte/action';

export const portal: Action<HTMLElement, HTMLElement | string | undefined> = (
	node,
	target = 'body'
) => {
	const host = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
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
