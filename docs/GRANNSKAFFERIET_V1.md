# Grannskafferiet v1 — spec (geo, trust & karta)

Status: **v1.2 shipped** (jun 2026). Push och Pro-radie kommer senare.

Se även: [`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md) (token-länk + dela som bild).

## Syfte

Låt opt-in-användare **upptäcka** att någon i närheten delat utgående varor — utan att exponera adress, hushåll eller kontakt. v0 (länk + bild) fortsätter gälla parallellt.

## Scope per version

| v1.0 | v1.1 | v1.2 |
|------|------|------|
| Opt-in + grov plats (~111 m) | Report + block | Dedikerad discovery-sida `/grannskafferiet` |
| Feed inom ~500 m på `/hem` | E-post till ägare vid report (om `ERROR_ALERT_TO`) | MapLibre-karta med jitter-prickar |
| Ungefärligt avstånd | Dölj token/hushåll för reporter | Lista + bottom sheet, `openPath` utan token i nearby API |
| | | PMF: `nearby_map_opened`, `nearby_share_tapped` |

**Ingår inte än:** push till närliggande, Pro-radie (2 km), chatt, bokning, exakta hem-prickar.

## Flöde

1. Användare aktiverar **Grannskafferiet i närheten** under Inställningar → webbläsaren begär plats → server sparar **grov** lat/lng på `user`.
2. Vid **Dela utgående lista** (om opt-in): klient skickar valfri färsk plats → server sparar grov lat/lng på `expiring_share_link`.
3. Opt-in-användare ser panelen på `/hem` och kan öppna **`/grannskafferiet`** (karta + lista).
4. `GET /api/expiring-share/nearby` returnerar jitterade `mapLat`/`mapLng` — **aldrig** raw lat/lng för andras hem.
5. Mottagare öppnar lista via `openPath` (`/grannskafferiet/share/{id}`) efter nearby-validering — token läcker inte i feed.

## Datamodell

### `user` (v1.0)

- `nearby_sharing_enabled`, `nearby_sharing_lat` / `nearby_sharing_lng`, `nearby_sharing_updated_at`

### `expiring_share_link` (v1.0)

- `latitude` / `longitude` — nullable; grov plats vid delning

### `expiring_share_report` (v1.1)

- `share_id`, `reporter_user_id`, `reason`, `created_at`

### `expiring_share_block` (v1.1)

- `reporter_user_id` + `share_id` och/eller `household_id` — döljer för reporter

## API

| Metod | Sökväg | Auth | Beskrivning |
|-------|--------|------|-------------|
| `POST` | `/api/expiring-share` | Ja | Skapa länk; valfritt `{ attachNearby, latitude?, longitude? }` |
| `GET` | `/api/expiring-share/nearby` | Ja | Lista med `mapLat`, `mapLng`, `openPath` |
| `GET`/`POST` | `/api/expiring-share/nearby-settings` | Ja | Läs/spara opt-in + plats |
| `POST` | `/api/expiring-share/report` | Ja | Rapportera; blockera share (+ valfritt hushåll) |

## Karta & integritet

- **Jitter** — `jitterCoordinateForDisplay(id, coarseCoord)` i `geo.ts`; deterministisk per share-id.
- **Gratis för alla** — ingen Pro-gate på karta eller nearby-lista i v1.2.
- **Ingen adress** i snapshot, feed, karta eller publik `/dela/[token]`.

## Planerat v2+ (ej implementerat)

- Web push: "Någon nära dig delar utgående varor"
- **Pro:** större radie (2 km vs 500 m), ev. längre TTL — se [`PRICING.md`](./PRICING.md)

## Kod

- Geo: `src/lib/domain/geo.ts`
- Service: `src/lib/application/expiring-share.service.ts`
- Repository: `src/lib/infrastructure/repositories/expiring-share.repository.ts`
- API: `src/routes/api/expiring-share/`
- UI: `EatFirstSection.svelte`, `NearbySharesMap.svelte`, `/grannskafferiet`
- Migrationer: `0038_nearby_expiring_share.sql`, `0039_expiring_share_report_block.sql`
