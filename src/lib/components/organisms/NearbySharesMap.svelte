<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { t } from '$lib/i18n';

	export interface NearbyMapShare {
		id: string;
		mapLat: number;
		mapLng: number;
		pinLabel?: string | null;
		hasActiveChat?: boolean;
		chatUnread?: boolean;
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

	const CLUSTER_THRESHOLD = 5;

	let mapContainer = $state<HTMLDivElement | null>(null);
	let mapReady = $state(false);
	let mapError = $state<string | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let maplibregl: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let youMarker: any = null;

	const useClusters = $derived(shares.length > CLUSTER_THRESHOLD);

	function defaultCenter(): [number, number] {
		if (centerLat != null && centerLng != null) {
			return [centerLng, centerLat];
		}
		if (shares.length > 0) {
			return [shares[0]!.mapLng, shares[0]!.mapLat];
		}
		return [18.0686, 59.3293];
	}

	function sharesGeoJson() {
		return {
			type: 'FeatureCollection',
			features: shares.map((share) => ({
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [share.mapLng, share.mapLat]
				},
				properties: {
					id: share.id,
					selected: share.id === selectedShareId
				}
			}))
		};
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

	function renderYouMarker() {
		if (!map || !maplibregl) {
			return;
		}

		youMarker?.remove();
		youMarker = null;

		if (centerLat == null || centerLng == null) {
			return;
		}

		const markerEl = document.createElement('div');
		markerEl.className = 'nearby-map-you-marker';
		markerEl.setAttribute('aria-label', t('nearbySharing.youMarkerLabel'));
		markerEl.textContent = t('nearbySharing.youMarkerShort');

		youMarker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
			.setLngLat([centerLng, centerLat])
			.addTo(map);
	}

	function clearDomMarkers() {
		if (!map) {
			return;
		}
		const existing = map.getContainer().querySelectorAll('[data-nearby-marker]');
		for (const node of existing) {
			node.remove();
		}
	}

	function renderDomMarkers() {
		if (!map || !maplibregl || useClusters) {
			return;
		}

		clearDomMarkers();

		for (const share of shares) {
			const markerEl = document.createElement('button');
			markerEl.type = 'button';
			markerEl.dataset.nearbyMarker = share.id;
			markerEl.className = 'nearby-map-marker';
			markerEl.setAttribute('aria-label', t('nearbySharing.mapMarkerLabel'));
			if (share.id === selectedShareId) {
				markerEl.classList.add('selected');
			}
			if (share.chatUnread) {
				markerEl.classList.add('has-chat-unread');
			} else if (share.hasActiveChat) {
				markerEl.classList.add('has-chat');
			}

			const labelEl = document.createElement('span');
			labelEl.className = 'nearby-map-marker-label';
			labelEl.textContent = share.pinLabel?.trim() || '•';
			markerEl.appendChild(labelEl);

			if (share.chatUnread || share.hasActiveChat) {
				const chatDot = document.createElement('span');
				chatDot.className = 'nearby-map-marker-chat';
				chatDot.setAttribute('aria-hidden', 'true');
				markerEl.appendChild(chatDot);
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

	function removeClusterLayers() {
		if (!map) {
			return;
		}
		for (const layerId of ['nearby-clusters', 'nearby-cluster-count', 'nearby-unclustered']) {
			if (map.getLayer(layerId)) {
				map.removeLayer(layerId);
			}
		}
		if (map.getSource('nearby-shares')) {
			map.removeSource('nearby-shares');
		}
	}

	function mapColors() {
		if (typeof document === 'undefined') {
			return { primary: '#2563eb', warning: '#d97706', surface: '#ffffff', text: '#111827' };
		}
		const styles = getComputedStyle(document.documentElement);
		return {
			primary: styles.getPropertyValue('--color-primary').trim() || '#2563eb',
			warning: styles.getPropertyValue('--color-warning').trim() || '#d97706',
			surface: styles.getPropertyValue('--color-surface').trim() || '#ffffff',
			text: styles.getPropertyValue('--color-text').trim() || '#111827'
		};
	}

	function setupClusterLayers() {
		if (!map || !useClusters) {
			removeClusterLayers();
			return;
		}

		clearDomMarkers();
		removeClusterLayers();

		const colors = mapColors();

		map.addSource('nearby-shares', {
			type: 'geojson',
			data: sharesGeoJson(),
			cluster: true,
			clusterMaxZoom: 14,
			clusterRadius: 50
		});

		map.addLayer({
			id: 'nearby-clusters',
			type: 'circle',
			source: 'nearby-shares',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': colors.primary,
				'circle-radius': ['step', ['get', 'point_count'], 18, 5, 22, 10, 26],
				'circle-stroke-width': 2,
				'circle-stroke-color': colors.surface
			}
		});

		map.addLayer({
			id: 'nearby-cluster-count',
			type: 'symbol',
			source: 'nearby-shares',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-size': 12
			},
			paint: {
				'text-color': '#fff'
			}
		});

		map.addLayer({
			id: 'nearby-unclustered',
			type: 'circle',
			source: 'nearby-shares',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': [
					'case',
					['==', ['get', 'selected'], true],
					colors.warning,
					colors.primary
				],
				'circle-radius': ['case', ['==', ['get', 'selected'], true], 10, 8],
				'circle-stroke-width': 2,
				'circle-stroke-color': colors.surface
			}
		});

		map.on('click', 'nearby-clusters', (event: { features?: Array<{ geometry: { coordinates: number[] } }> }) => {
			const feature = event.features?.[0];
			if (!feature) {
				return;
			}
			const coordinates = feature.geometry.coordinates.slice() as [number, number];
			map.easeTo({ center: coordinates, zoom: map.getZoom() + 2 });
		});

		map.on('click', 'nearby-unclustered', (event: { features?: Array<{ properties?: { id?: string } }> }) => {
			const shareId = event.features?.[0]?.properties?.id;
			if (shareId) {
				onSelectShare?.(shareId);
			}
		});

		map.on('mouseenter', 'nearby-clusters', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'nearby-clusters', () => {
			map.getCanvas().style.cursor = '';
		});
		map.on('mouseenter', 'nearby-unclustered', () => {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', 'nearby-unclustered', () => {
			map.getCanvas().style.cursor = '';
		});
	}

	function refreshMapData() {
		if (!mapReady || !map) {
			return;
		}

		renderYouMarker();

		if (useClusters) {
			const source = map.getSource('nearby-shares');
			if (source) {
				source.setData(sharesGeoJson());
			} else {
				setupClusterLayers();
			}
		} else {
			removeClusterLayers();
			renderDomMarkers();
		}

		if (shares.length > 0) {
			fitShares();
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
				refreshMapData();
			});
		} catch {
			mapError = t('nearbySharing.mapLoadFailed');
		}
	});

	$effect(() => {
		if (!mapReady) {
			return;
		}
		refreshMapData();
	});

	onDestroy(() => {
		youMarker?.remove();
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
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.55rem;
		border-radius: 999px;
		border: 2px solid var(--color-surface);
		background: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 35%, transparent);
		cursor: pointer;
	}

	:global(.nearby-map-marker-label) {
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-surface);
		white-space: nowrap;
	}

	:global(.nearby-map-marker-chat) {
		position: absolute;
		top: -0.1rem;
		right: -0.1rem;
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 999px;
		border: 2px solid var(--color-surface);
		background: var(--color-text-muted);
	}

	:global(.nearby-map-marker.has-chat-unread .nearby-map-marker-chat) {
		background: var(--color-warning, #d97706);
	}

	:global(.nearby-map-marker.selected) {
		background: var(--color-warning);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-warning) 40%, transparent);
	}

	:global(.nearby-map-you-marker) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		border: 2px solid var(--color-surface);
		background: var(--color-text);
		color: var(--color-surface);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-text) 25%, transparent);
	}
</style>
