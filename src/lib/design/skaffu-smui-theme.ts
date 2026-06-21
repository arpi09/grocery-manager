/** Skaffu ↔ SMUI token bridge — keep in sync with src/theme/_variables.scss and src/app.css */

import { BRAND_PRIMARY, BRAND_PRIMARY_DARK } from '$lib/design/brand-colors';

export const skaffuSmuiTokens = {
	light: {
		primary: BRAND_PRIMARY,
		primaryHover: '#325a42',
		surface: '#ffffff',
		surfaceMuted: '#eef2eb',
		background: '#f7f5f0',
		onSurface: '#1f2a24',
		onSurfaceMuted: '#4a5850',
		error: '#b54a4a',
		border: '#dde5d8',
		radiusSm: '8px',
		radiusMd: '12px',
		radiusLg: '16px',
		fontFamily: "'DM Sans', system-ui, sans-serif"
	},
	dark: {
		primary: BRAND_PRIMARY_DARK,
		primaryHover: '#5aa076',
		surface: '#1e2621',
		surfaceMuted: '#273029',
		background: '#141a17',
		onSurface: '#e8eee9',
		onSurfaceMuted: '#a3b0a8',
		error: '#e07a7a',
		border: '#3a4540',
		radiusSm: '8px',
		radiusMd: '12px',
		radiusLg: '16px',
		fontFamily: "'DM Sans', system-ui, sans-serif"
	}
} as const;

export const skaffuSmuiClassNames = {
	table: 'skaffu-table',
	list: 'skaffu-list',
	listItem: 'skaffu-list-item',
	card: 'skaffu-card'
} as const;

export type SkaffuSmuiThemeMode = keyof typeof skaffuSmuiTokens;
