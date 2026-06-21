<!-- AUTO-GENERATED — do not edit. Run: npm run generate:route-index -->

# Route index

Generated 2026-06-21 from `src/routes/**`.

Curated feature mapping: [CODEBASE_MAP.md](../CODEBASE_MAP.md). CI manifest: [codebase-map.manifest.json](../codebase-map.manifest.json).

## Summary

| Metric | Count |
|--------|-------|
| Total route endpoints | 135 |
| With +page.svelte | 57 |
| Server-only (+page.server / +server) | 78 |
| /api/* | 67 |

## User-facing pages (+page.svelte)

| Route | Route dir |
|-------|-----------|
| `/` | `(marketing)` |
| `/admin` | `admin` |
| `/admin/guide-preview/[id]` | `admin/guide-preview/[id]` |
| `/dela/[token]` | `dela/[token]` |
| `/delningar` | `delningar` |
| `/faq` | `(marketing)/faq` |
| `/forgot-password` | `forgot-password` |
| `/funktioner` | `(marketing)/funktioner` |
| `/grannskafferiet` | `grannskafferiet` |
| `/grannskafferiet/share/[id]` | `grannskafferiet/share/[id]` |
| `/guider` | `(marketing)/guider` |
| `/guider/[slug]` | `(marketing)/guider/[slug]` |
| `/hem` | `(app)/hem` |
| `/husdjur` | `husdjur` |
| `/inkop` | `inkop` |
| `/install-app` | `install-app` |
| `/inventory` | `inventory` |
| `/inventory/[location]` | `inventory/[location]` |
| `/inventory/merge` | `inventory/merge` |
| `/inventory/synk` | `inventory/synk` |
| `/invite/[token]` | `invite/[token]` |
| `/item/[id]/edit` | `item/[id]/edit` |
| `/item/new` | `inventory/[location]/(..)(..)item/new` |
| `/kvitto-pdf-kivra` | `(marketing)/kvitto-pdf-kivra` |
| `/lista/[token]` | `lista/[token]` |
| `/login` | `login` |
| `/minska-matsvinn` | `(marketing)/minska-matsvinn` |
| `/nyheter` | `nyheter` |
| `/planer` | `planer` |
| `/planer/vecka` | `planer/vecka` |
| `/priser` | `(marketing)/priser` |
| `/privacy` | `(marketing)/privacy` |
| `/profile` | `profile` |
| `/rapport/[month]` | `(marketing)/rapport/[month]` |
| `/recept/[id]` | `recept/[id]` |
| `/recept/[id]/laga` | `recept/[id]/laga` |
| `/register` | `register` |
| `/reset-password/[token]` | `reset-password/[token]` |
| `/sa-fungerar-det` | `(marketing)/sa-fungerar-det` |
| `/scan` | `scan` |
| `/settings` | `settings` |
| `/settings/account` | `settings/account` |
| `/settings/app` | `settings/app` |
| `/settings/feedback` | `settings/feedback` |
| `/settings/household` | `settings/household` |
| `/settings/kivra` | `settings/kivra` |
| `/settings/memory` | `settings/memory` |
| `/settings/nearby` | `settings/nearby` |
| `/settings/notifications` | `settings/notifications` |
| `/settings/plan` | `settings/plan` |
| `/settings/price-memory` | `settings/price-memory` |
| `/settings/suggestions` | `settings/suggestions` |
| `/skafferi-app` | `(marketing)/skafferi-app` |
| `/statistik` | `statistik` |
| `/statistik/wrapped` | `statistik/wrapped` |
| `/verify-email` | `verify-email` |
| `/verify-email/[token]` | `verify-email/[token]` |

## Server-only routes (no +page.svelte)

| Route | Files | Route dir |
|-------|-------|-----------|
| `/api/admin/data` | +server.ts | `api/admin/data` |
| `/api/admin/marketing-campaigns` | +server.ts | `api/admin/marketing-campaigns` |
| `/api/admin/marketing-campaigns/generate` | +server.ts | `api/admin/marketing-campaigns/generate` |
| `/api/admin/social-posts` | +server.ts | `api/admin/social-posts` |
| `/api/analytics/beacon` | +server.ts | `api/analytics/beacon` |
| `/api/barcode/[code]` | +server.ts | `api/barcode/[code]` |
| `/api/brain/feedback` | +server.ts | `api/brain/feedback` |
| `/api/brain/feedback/restore` | +server.ts | `api/brain/feedback/restore` |
| `/api/client-errors` | +server.ts | `api/client-errors` |
| `/api/cookie-consent` | +server.ts | `api/cookie-consent` |
| `/api/cron/analytics-rollup` | +server.ts | `api/cron/analytics-rollup` |
| `/api/cron/error-alert` | +server.ts | `api/cron/error-alert` |
| `/api/cron/error-export` | +server.ts | `api/cron/error-export` |
| `/api/cron/expiry-reminders` | +server.ts | `api/cron/expiry-reminders` |
| `/api/cron/pmf-weekly` | +server.ts | `api/cron/pmf-weekly` |
| `/api/cron/reset-demo` | +server.ts | `api/cron/reset-demo` |
| `/api/cron/shopping-push` | +server.ts | `api/cron/shopping-push` |
| `/api/cron/skaffurapport` | +server.ts | `api/cron/skaffurapport` |
| `/api/eat-first` | +server.ts | `api/eat-first` |
| `/api/expiring-share` | +server.ts | `api/expiring-share` |
| `/api/expiring-share/nearby` | +server.ts | `api/expiring-share/nearby` |
| `/api/expiring-share/nearby-push-settings` | +server.ts | `api/expiring-share/nearby-push-settings` |
| `/api/expiring-share/nearby-settings` | +server.ts | `api/expiring-share/nearby-settings` |
| `/api/expiring-share/report` | +server.ts | `api/expiring-share/report` |
| `/api/health/ai` | +server.ts | `api/health/ai` |
| `/api/health/db` | +server.ts | `api/health/db` |
| `/api/household/share-invite` | +server.ts | `api/household/share-invite` |
| `/api/inbound/kivra` | +server.ts | `api/inbound/kivra` |
| `/api/inventory-insights` | +server.ts | `api/inventory-insights` |
| `/api/inventory/data` | +server.ts | `api/inventory/data` |
| `/api/inventory/merge-candidates` | +server.ts | `api/inventory/merge-candidates` |
| `/api/inventory/photo-scan` | +server.ts | `api/inventory/photo-scan` |
| `/api/inventory/staleness` | +server.ts | `api/inventory/staleness` |
| `/api/linkedin/authorize` | +server.ts | `api/linkedin/authorize` |
| `/api/linkedin/callback` | +server.ts | `api/linkedin/callback` |
| `/api/planer/ideas` | +server.ts | `api/planer/ideas` |
| `/api/planer/ideas/dismiss` | +server.ts | `api/planer/ideas/dismiss` |
| `/api/planer/schedule-idea` | +server.ts | `api/planer/schedule-idea` |
| `/api/planer/weekly-ritual/approve` | +server.ts | `api/planer/weekly-ritual/approve` |
| `/api/pmf-survey` | +server.ts | `api/pmf-survey` |
| `/api/price-memory/last` | +server.ts | `api/price-memory/last` |
| `/api/price-memory/search` | +server.ts | `api/price-memory/search` |
| `/api/price-memory/summary` | +server.ts | `api/price-memory/summary` |
| `/api/price-memory/timeline` | +server.ts | `api/price-memory/timeline` |
| `/api/product-events` | +server.ts | `api/product-events` |
| `/api/product-from-image` | +server.ts | `api/product-from-image` |
| `/api/push/disable` | +server.ts | `api/push/disable` |
| `/api/push/subscribe` | +server.ts | `api/push/subscribe` |
| `/api/push/unsubscribe` | +server.ts | `api/push/unsubscribe` |
| `/api/push/vapid-public-key` | +server.ts | `api/push/vapid-public-key` |
| `/api/receipt-autopilot/accept` | +server.ts | `api/receipt-autopilot/accept` |
| `/api/receipt-autopilot/dismiss` | +server.ts | `api/receipt-autopilot/dismiss` |
| `/api/receipt-autopilot/finish` | +server.ts | `api/receipt-autopilot/finish` |
| `/api/receipt-autopilot/finish-dismiss` | +server.ts | `api/receipt-autopilot/finish-dismiss` |
| `/api/receipt/parse` | +server.ts | `api/receipt/parse` |
| `/api/receipt/share-pending` | +server.ts | `api/receipt/share-pending` |
| `/api/recipes` | +server.ts | `api/recipes` |
| `/api/recipes/add-missing` | +server.ts | `api/recipes/add-missing` |
| `/api/replenishment/accept` | +server.ts | `api/replenishment/accept` |
| `/api/replenishment/dismiss` | +server.ts | `api/replenishment/dismiss` |
| `/api/shopping-list/share` | +server.ts | `api/shopping-list/share` |
| `/api/shopping-suggestions` | +server.ts | `api/shopping-suggestions` |
| `/api/shopping/data` | +server.ts | `api/shopping/data` |
| `/api/statistik/analytics` | +server.ts | `api/statistik/analytics` |
| `/api/stripe/checkout` | +server.ts | `api/stripe/checkout` |
| `/api/stripe/portal` | +server.ts | `api/stripe/portal` |
| `/api/stripe/webhook` | +server.ts | `api/stripe/webhook` |
| `/auth/google` | +server.ts | `auth/google` |
| `/auth/google/callback` | +server.ts | `auth/google/callback` |
| `/inventory/foto` | +page.server.ts | `inventory/foto` |
| `/logout` | +server.ts | `logout` |
| `/news` | +page.server.ts | `news` |
| `/robots.txt` | +server.ts | `robots.txt` |
| `/scan/foto` | +page.server.ts | `scan/foto` |
| `/scan/kvitto` | +page.server.ts | `scan/kvitto` |
| `/scan/share` | +server.ts | `scan/share` |
| `/scan/snabbstart` | +page.server.ts | `scan/snabbstart` |
| `/sitemap.xml` | +server.ts | `sitemap.xml` |

## API routes (/api/*)

| Route | Route dir |
|-------|-----------|
| `/api/admin/data` | `api/admin/data` |
| `/api/admin/marketing-campaigns` | `api/admin/marketing-campaigns` |
| `/api/admin/marketing-campaigns/generate` | `api/admin/marketing-campaigns/generate` |
| `/api/admin/social-posts` | `api/admin/social-posts` |
| `/api/analytics/beacon` | `api/analytics/beacon` |
| `/api/barcode/[code]` | `api/barcode/[code]` |
| `/api/brain/feedback` | `api/brain/feedback` |
| `/api/brain/feedback/restore` | `api/brain/feedback/restore` |
| `/api/client-errors` | `api/client-errors` |
| `/api/cookie-consent` | `api/cookie-consent` |
| `/api/cron/analytics-rollup` | `api/cron/analytics-rollup` |
| `/api/cron/error-alert` | `api/cron/error-alert` |
| `/api/cron/error-export` | `api/cron/error-export` |
| `/api/cron/expiry-reminders` | `api/cron/expiry-reminders` |
| `/api/cron/pmf-weekly` | `api/cron/pmf-weekly` |
| `/api/cron/reset-demo` | `api/cron/reset-demo` |
| `/api/cron/shopping-push` | `api/cron/shopping-push` |
| `/api/cron/skaffurapport` | `api/cron/skaffurapport` |
| `/api/eat-first` | `api/eat-first` |
| `/api/expiring-share` | `api/expiring-share` |
| `/api/expiring-share/nearby` | `api/expiring-share/nearby` |
| `/api/expiring-share/nearby-push-settings` | `api/expiring-share/nearby-push-settings` |
| `/api/expiring-share/nearby-settings` | `api/expiring-share/nearby-settings` |
| `/api/expiring-share/report` | `api/expiring-share/report` |
| `/api/health/ai` | `api/health/ai` |
| `/api/health/db` | `api/health/db` |
| `/api/household/share-invite` | `api/household/share-invite` |
| `/api/inbound/kivra` | `api/inbound/kivra` |
| `/api/inventory-insights` | `api/inventory-insights` |
| `/api/inventory/data` | `api/inventory/data` |
| `/api/inventory/merge-candidates` | `api/inventory/merge-candidates` |
| `/api/inventory/photo-scan` | `api/inventory/photo-scan` |
| `/api/inventory/staleness` | `api/inventory/staleness` |
| `/api/linkedin/authorize` | `api/linkedin/authorize` |
| `/api/linkedin/callback` | `api/linkedin/callback` |
| `/api/planer/ideas` | `api/planer/ideas` |
| `/api/planer/ideas/dismiss` | `api/planer/ideas/dismiss` |
| `/api/planer/schedule-idea` | `api/planer/schedule-idea` |
| `/api/planer/weekly-ritual/approve` | `api/planer/weekly-ritual/approve` |
| `/api/pmf-survey` | `api/pmf-survey` |
| `/api/price-memory/last` | `api/price-memory/last` |
| `/api/price-memory/search` | `api/price-memory/search` |
| `/api/price-memory/summary` | `api/price-memory/summary` |
| `/api/price-memory/timeline` | `api/price-memory/timeline` |
| `/api/product-events` | `api/product-events` |
| `/api/product-from-image` | `api/product-from-image` |
| `/api/push/disable` | `api/push/disable` |
| `/api/push/subscribe` | `api/push/subscribe` |
| `/api/push/unsubscribe` | `api/push/unsubscribe` |
| `/api/push/vapid-public-key` | `api/push/vapid-public-key` |
| `/api/receipt-autopilot/accept` | `api/receipt-autopilot/accept` |
| `/api/receipt-autopilot/dismiss` | `api/receipt-autopilot/dismiss` |
| `/api/receipt-autopilot/finish` | `api/receipt-autopilot/finish` |
| `/api/receipt-autopilot/finish-dismiss` | `api/receipt-autopilot/finish-dismiss` |
| `/api/receipt/parse` | `api/receipt/parse` |
| `/api/receipt/share-pending` | `api/receipt/share-pending` |
| `/api/recipes` | `api/recipes` |
| `/api/recipes/add-missing` | `api/recipes/add-missing` |
| `/api/replenishment/accept` | `api/replenishment/accept` |
| `/api/replenishment/dismiss` | `api/replenishment/dismiss` |
| `/api/shopping-list/share` | `api/shopping-list/share` |
| `/api/shopping-suggestions` | `api/shopping-suggestions` |
| `/api/shopping/data` | `api/shopping/data` |
| `/api/statistik/analytics` | `api/statistik/analytics` |
| `/api/stripe/checkout` | `api/stripe/checkout` |
| `/api/stripe/portal` | `api/stripe/portal` |
| `/api/stripe/webhook` | `api/stripe/webhook` |
