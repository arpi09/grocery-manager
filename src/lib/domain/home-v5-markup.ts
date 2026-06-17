/** Accessibility contract for Home redesign v5 — tested without mounting Svelte. */
export const HOME_V5_MARKUP = {
	rootClass: 'home-v5',
	heroTestId: 'home-hero',
	heroHeadingLevel: 1,
	cardHeadingLevel: 2,
	landmarkRole: 'section',
	decorativeIllustration: 'aria-hidden',
	cardTestIds: [
		'home-for-you-card',
		'home-expiring-card',
		'home-shopping-card',
		'home-pantry-card',
		'home-household-card'
	] as const
} as const;
