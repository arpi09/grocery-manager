const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let savedFocus: HTMLElement | null = null;
let scrollLockCount = 0;
let lockedScrollY = 0;

export function saveFocus(): void {
	if (typeof document === 'undefined') {
		return;
	}
	const active = document.activeElement;
	savedFocus = active instanceof HTMLElement ? active : null;
}

export function restoreFocus(): void {
	if (typeof document === 'undefined' || !savedFocus) {
		return;
	}
	if (savedFocus.isConnected) {
		savedFocus.focus();
	}
	savedFocus = null;
}

export function lockBodyScroll(): void {
	if (typeof document === 'undefined') {
		return;
	}
	if (scrollLockCount === 0) {
		lockedScrollY = window.scrollY;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
	}
	scrollLockCount += 1;
}

export function unlockBodyScroll(): void {
	if (typeof document === 'undefined') {
		return;
	}
	scrollLockCount = Math.max(0, scrollLockCount - 1);
	if (scrollLockCount === 0) {
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
		window.scrollTo(0, lockedScrollY);
	}
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
		(el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
	);
}

export function focusInitialElement(container: HTMLElement): void {
	const focusables = getFocusableElements(container);
	const target = focusables[0] ?? container;
	if (!target.hasAttribute('tabindex')) {
		target.tabIndex = -1;
	}
	target.focus();
}

export function trapFocus(container: HTMLElement): () => void {
	function onKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Tab') {
			return;
		}
		const focusables = getFocusableElements(container);
		if (focusables.length === 0) {
			event.preventDefault();
			return;
		}
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	container.addEventListener('keydown', onKeyDown);
	return () => container.removeEventListener('keydown', onKeyDown);
}
