# Activation Funnel

North star for **0-user activation** — replaces empty Brain Impact killer rows until cohorts exist.

## Funnel steps

### Loop-funnel (Skaffu 2.0 — primär)

Kärnloopens aktiveringskedja; våg 3–5 i 2.0-planen optimerar mot dessa.

| Step | Event / metric | Notering |
|------|----------------|----------|
| Landning | `public_surface_viewed` / marketing pageviews | inkl. gäst via `/lista/[token]` |
| Registrering | `signup_complete` | Baseline |
| Första varan på listan | `shopping_first_item_added` | metadata.surface = inkop_add / quick_add_api / home_expiring_card |
| Partner ombord | `partner_joined` | metadata.context = lista / invite |
| Stängd loop | `shopping_loop_closed` | ETT event per Packa upp-gest; metadata {count, added, merged} |

### Legacy-funnel (kvitto-centrisk, pre-2.0)

| Step | Event / metric | Early target |
|------|----------------|--------------|
| Registrering | `signup_complete` | Baseline |
| Onboarding start | `onboarding_started` | >80% of signups |
| Första kvitto | `receipt_parsed` within 24h of signup | >40% |
| Varor i lager | `inventory_items` ≥5 within 24h | >30% |
| 3-rätter-wow | `activation_recipes_shown` | >50% of receipt users |
| Dag 7 återbesök | `last_seen_at` ≥7d after signup | ~15% |
| Lista delad | `shared_list_opened` | W1 baseline |

## Where to read it

- **Admin:** `/admin` → Analytics → **Activation Funnel** (top panel)
- **Code:** `src/lib/domain/activation-funnel.ts`, `getActivationFunnelMetrics` in PMF repository

## Kill criteria

From [BREAKTHROUGH_GROWTH_OPPORTUNITIES.md](./BREAKTHROUGH_GROWTH_OPPORTUNITIES.md): **<10 activations in 4 weeks** → audience/market problem, not more brain features.

## Gated phases

| Phase | Gate | Features |
|-------|------|----------|
| **A** (now) | — | Kvitto-wow, Kivra hero, lista wedge |
| **B** | ≥50 households, ≥40% activation | Meal-first week, pantry twin |
| **C** | 2+ receipts/household or 2 members | Reconcile, zero-list, negotiation |

See plan: activation-first; retention killers wait for data.

## Telemetry

| Event | When |
|-------|------|
| `activation_recipes_shown` | 3 recipe cards rendered after receipt import |
| `activation_recipe_clicked` | User opens a post-import recipe |
