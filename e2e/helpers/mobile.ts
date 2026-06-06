import { expect, type Page } from '@playwright/test';

/** iPhone 14 baseline from docs/MOBILE_AUDIT.md */
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

/** Matches `--touch-target-min: 2.75rem` at 16px root */
export const TOUCH_TARGET_MIN_PX = 44;

const TOUCH_SAMPLE_MAX = 25;

export async function expectNoHorizontalScroll(page: Page, routeLabel: string) {
	const overflowPx = await page.evaluate(() => {
		const root = document.documentElement;
		return root.scrollWidth - root.clientWidth;
	});

	expect(
		overflowPx,
		`${routeLabel}: document scrollWidth exceeds viewport by ${overflowPx}px`
	).toBeLessThanOrEqual(1);
}

export async function expectSampledTouchTargets(page: Page, routeLabel: string) {
	const undersized = await page.evaluate(
		({ minPx, maxSample }) => {
			const root = document.querySelector('.app') ?? document.body;
			const selector =
				'button:not([disabled]), a[href], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"]:not([aria-disabled="true"]), [role="link"], [role="tab"]';
			const elements = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => {
				const style = getComputedStyle(el);
				if (style.visibility === 'hidden' || style.display === 'none' || style.pointerEvents === 'none') {
					return false;
				}
				const rect = el.getBoundingClientRect();
				if (rect.width < 24 || rect.height < 24) return false;
				if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) {
					return false;
				}
				return true;
			});

			const step = Math.max(1, Math.floor(elements.length / maxSample));
			const sample = elements.filter((_, index) => index % step === 0).slice(0, maxSample);

			return sample
				.filter((el) => {
					const rect = el.getBoundingClientRect();
					return rect.width < minPx || rect.height < minPx;
				})
				.map((el) => {
					const rect = el.getBoundingClientRect();
					const label =
						el.getAttribute('aria-label') ||
						el.getAttribute('title') ||
						el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 48) ||
						el.tagName.toLowerCase();
					return `${label}: ${Math.round(rect.width)}×${Math.round(rect.height)}px`;
				});
		},
		{ minPx: TOUCH_TARGET_MIN_PX, maxSample: TOUCH_SAMPLE_MAX }
	);

	expect(
		undersized,
		`${routeLabel}: sampled touch targets below ${TOUCH_TARGET_MIN_PX}px:\n${undersized.join('\n')}`
	).toHaveLength(0);
}
