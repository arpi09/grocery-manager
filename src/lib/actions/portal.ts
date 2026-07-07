import type { Action } from 'svelte/action';

/** Pass `null` to explicitly opt out of portaling (render inline) — `undefined`
 * falls through to the 'body' default, which made `portal={false}` on Toast a
 * silent no-op for inline undo rows. */
export const portal: Action<HTMLElement, HTMLElement | string | null | undefined> = (
	node,
	target = 'body'
) => {
	if (target === null) {
		return;
	}

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
