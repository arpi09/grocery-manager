# Grannskafferiet v1 — spec (geo, trust & karta)

Status: **v2a–v2c shipped** (jun 2026). Nearby-push gratis med opt-in; Pro-radie 2 km i kod (Stripe-gate); kart-polish + admin-rapporter.

Se även: [`GRANNSKAFFERIET_V0.md`](./GRANNSKAFFERIET_V0.md) (token-länk + dela som bild).

## Syfte

Låt opt-in-användare **upptäcka** att någon i närheten delat utgående varor — utan att exponera adress, hushåll eller kontakt. v0 (länk + bild) fortsätter gälla parallellt.

## Scope per version

| v1.0 | v1.1 | v1.2 | v2a | v2b | v2c |
|------|------|------|-----|-----|-----|
| Opt-in + grov plats (~111 m) | Report + block | `/grannskafferiet` + MapLibre | **Nearby push** (gratis, opt-in) | **Pro 2 km** radie | Karta clusters, du-markör, expiry badges, admin reports |
| Feed inom ~500 m på `/hem` | E-post vid report | Bottom sheet + PMF events | Push med varunamn | Soft Pro CTA på karta | Pro TTL 72 h för sharers |

**Ingår inte än:** chatt, bokning, exakta hem-prickar.

## Flöde

1. Användare aktiverar **Grannskafferiet i närheten** under Inställningar → webbläsaren begär plats → server sparar **grov** lat/lng på `user`.
2. Valfritt: **Notis när någon nära delar** (kräver web push + nearby opt-in) — gratis för alla.
3. Vid **Dela utgående lista** (om opt-in): klient skickar valfri färsk plats → server sparar grov lat/lng på `expiring_share_link` → **best-effort push** till opted-in viewers inom radie.
4. Opt-in-användare ser panelen på `/hem` och **`/grannskafferiet`** (karta + lista). Free: 500 m; Pro: 2 km (`getNearbyRadiusM`).
5. `GET /api/expiring-share/nearby` returnerar jitterade `mapLat`/`mapLng` — **aldrig** raw lat/lng för andras hem.

## Datamodell

### `user` (v1.0 + v2a)

- `nearby_sharing_enabled`, `nearby_sharing_lat` / `nearby_sharing_lng`, `nearby_sharing_updated_at`
- `nearby_push_enabled`, `nearby_push_last_sent_at` (migration `0040`)

### `expiring_share_link` (v1.0)

- `latitude` / `longitude` — nullable; grov plats vid delning
- Pro sharers: TTL **72 h** (vs 48 h free) vid `createShareLink`

### `expiring_share_report` (v1.1)

- Admin-tabell i `/admin` → Grannskafferiet (dismiss-only v1)

## API

| Metod | Sökväg | Auth | Beskrivning |
|-------|--------|------|-------------|
| `POST` | `/api/expiring-share` | Ja | Skapa länk; valfritt `{ attachNearby, latitude?, longitude? }` → triggar nearby push |
| `GET` | `/api/expiring-share/nearby` | Ja | Lista + `radiusM` |
| `GET`/`POST` | `/api/expiring-share/nearby-settings` | Ja | Läs/spara opt-in + plats |
| `GET`/`POST` | `/api/expiring-share/nearby-push-settings` | Ja | Läs/spara nearby push opt-in |
| `POST` | `/api/expiring-share/report` | Ja | Rapportera; blockera share (+ valfritt hushåll) |

## Karta & integritet

- **Jitter** — `jitterCoordinateForDisplay(id, coarseCoord)` i `geo.ts`
- **Clusters** — MapLibre cluster layer när >5 prickar
- **Du-markör** — coarse viewer center, inte exakt hem
- **Gratis discovery + gratis nearby-push** — Pro = **räckvidd** (2 km), ev. längre TTL

## Kod

- Geo / radie: `src/lib/domain/geo.ts`, `src/lib/domain/plan.ts` (`getNearbyRadiusM`)
- Push: `src/lib/domain/nearby-push.ts`, `src/lib/application/nearby-push.service.ts`
- Service: `src/lib/application/expiring-share.service.ts`
- UI: `NearbySharesMap.svelte`, `NearbySharingSettingsPanel.svelte`, `/grannskafferiet`
- Migrationer: `0038`–`0040`
