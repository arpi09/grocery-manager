<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { t } from '$lib/i18n';

	export interface NearbyMapShare {
		id: string;
		mapLat: number;
		mapLng: number;
	}

	interface Props {
		shares: NearbyMapShare[];
		centerLat?: number | null;
		centerLng?: number | null;
		selectedShareId?: string | null;
		onSelectShare?: (shareId: string) => void;
	}

	let {
		shares,
		centerLat = null,
		centerLng = null,
		selectedShareId = null,
		onSelectShare
	}: Props = $props();

	let mapContainer = $state<HTMLDivElement | null>(null);
	let mapReady = $state(false);
	let mapError = $state<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let maplibregl: any = null;

	function defaultCenter(): [number, number] {
		if (centerLat != null && centerLng != null) {
			return [centerLng, centerLat];
		}
		if (shares.length > 0) {
			return [shares[0]!.mapLng, shares[0]!.mapLat];
		}
		return [18.0686, 59.3293];
	}

	function fitShares() {
		if (!map || !maplibregl || shares.length === 0) {
			return;
		}

		const bounds = new maplibregl.LngLatBounds();
		for (const share of shares) {
			bounds.extend([share.mapLng, share.mapLat]);
		}
		if (centerLat != null && centerLng != null) {
			bounds.extend([centerLng, centerLat]);
		}
		map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
	}

	function renderMarkers() {
		if (!map || !maplibregl) {
			return;
		}

		const existing = map.getContainer().querySelectorAll('[data-nearby-marker]');
		for (const node of existing) {
			node.remove();
		}

		for (const share of shares) {
			const markerEl = document.createElement('button');
			markerEl.type = 'button';
			markerEl.dataset.nearbyMarker = share.id;
			markerEl.className = 'nearby-map-marker';
			markerEl.setAttribute('aria-label', t('nearbySharing.mapMarkerLabel'));
			if (share.id === selectedShareId) {
				markerEl.classList.add('selected');
			}
			markerEl.addEventListener('click', (event) => {
				event.stopPropagation();
				onSelectShare?.(share.id);
			});

			new maplibregl.Marker({ element: markerEl, anchor: 'center' })
				.setLngLat([share.mapLng, share.mapLat])
				.addTo(map);
		}
	}

	onMount(async () => {
		if (!mapContainer) {
			return;
		}

		try {
			const module = await import('maplibre-gl');
			maplibregl = module.default;
			const [lng, lat] = defaultCenter();

			map = new maplibregl.Map({
				container: mapContainer,
				style: {
					version: 8,
					sources: {
						osm: {
							type: 'raster',
							tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
							tileSize: 256,
							attribution: '© OpenStreetMap contributors'
						}
					},
					layers: [
						{
							id: 'osm',
							type: 'raster',
							source: 'osm'
						}
					]
				},
				center: [lng, lat],
				zoom: shares.length > 0 ? 14 : 12,
				attributionControl: true
			});

			map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
			map.on('load', () => {
				mapReady = true;
				renderMarkers();
				fitShares();
			});
		} catch {
			mapError = t('nearbySharing.mapLoadFailed');
		}
	});

	$effect(() => {
		if (!mapReady) {
			return;
		}
		renderMarkers();
		if (shares.length > 0) {
			fitShares();
		}
	});

	onDestroy(() => {
		map?.remove();
		map = null;
	});
</script>

<div class="nearby-map-shell" data-testid="nearby-shares-map">
	{#if mapError}
		<p class="map-fallback" role="status">{mapError}</p>
	{:else}
		<div class="map-canvas" bind:this={mapContainer} aria-label={t('nearbySharing.mapAria')}></div>
		<p class="map-attribution">
			{t('nearbySharing.mapAttribution')}
		</p>
	{/if}
</div>

<style>
	.nearby-map-shell {
		position: relative;
		display: grid;
		gap: var(--space-2xs);
		min-height: 16rem;
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.map-canvas {
		width: 100%;
		min-height: 16rem;
		height: 50vh;
		max-height: 28rem;
	}

	.map-fallback,
	.map-attribution {
		margin: 0;
		padding: var(--space-sm) var(--space-md);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	:global(.nearby-map-marker) {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 999px;
		border: 2px solid var(--color-surface);
		background: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 35%, transparent);
		cursor: pointer;
		padding: 0;
	}

	:global(.nearby-map-marker.selected) {
		width: 1.35rem;
		height: 1.35rem;
		background: var(--color-warning);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warning) 40%, transparent);
	}
</style>
