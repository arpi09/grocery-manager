/** Skaffu ↔ SMUI token bridge — keep in sync with src/theme/_variables.scss and src/app.css */

import { DEFAULT_PALETTE_TRACK, LOCKED_LOGO_CORE, mergePalette } from '$lib/design/brand-colors';

const activePalette = mergePalette(DEFAULT_PALETTE_TRACK);

export const skaffuSmuiTokens = {
	light: {
		primary: activePalette.light.primary,
		primaryHover: activePalette.light.primaryHover,
		surface: activePalette.light.surface,
		surfaceMuted: activePalette.light.surfaceMuted,
		background: activePalette.light.bg,
		onSurface: activePalette.light.text,
		onSurfaceMuted: activePalette.light.textMuted,
		error: activePalette.light.danger,
		border: activePalette.light.border,
		radiusSm: '8px',
		radiusMd: '12px',
		radiusLg: '16px',
		fontFamily: "'DM Sans', system-ui, sans-serif"
	},
	dark: {
		primary: activePalette.dark.primary,
		primaryHover: activePalette.dark.primaryHover,
		surface: activePalette.dark.surface,
		surfaceMuted: activePalette.dark.surfaceMuted,
		background: activePalette.dark.bg,
		onSurface: activePalette.dark.text,
		onSurfaceMuted: activePalette.dark.textMuted,
		error: activePalette.dark.danger,
		border: activePalette.dark.border,
		radiusSm: '8px',
		radiusMd: '12px',
		radiusLg: '16px',
		fontFamily: "'DM Sans', system-ui, sans-serif"
	}
} as const;

/** Locked logo core for contexts that must not vary by palette track. */
export const skaffuLockedLogoCore = LOCKED_LOGO_CORE;

export const skaffuSmuiClassNames = {
	table: 'skaffu-table',
	list: 'skaffu-list',
	listItem: 'skaffu-list-item',
	card: 'skaffu-card'
} as const;

export type SkaffuSmuiThemeMode = keyof typeof skaffuSmuiTokens;
