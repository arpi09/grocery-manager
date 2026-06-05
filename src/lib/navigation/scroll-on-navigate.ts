import { afterNavigate } from '$app/navigation';
import { browser } from '$app/environment';

/** Scroll to top on in-app navigation; preserve back/forward and hash targets. */
export function initScrollOnNavigate(): void {
	if (!browser) {
		return;
	}

	afterNavigate((navigation) => {
		if (!navigation.to) {
			return;
		}

		if (navigation.type === 'popstate') {
			return;
		}

		const fromPath = navigation.from?.url.pathname;
		const toPath = navigation.to.url.pathname;
		if (fromPath === toPath) {
			return;
		}

		const hash = navigation.to.url.hash;
		if (hash.length > 1) {
			const target = document.querySelector(hash);
			if (target) {
				target.scrollIntoView({ block: 'start' });
				return;
			}
		}

		window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
	});
}
