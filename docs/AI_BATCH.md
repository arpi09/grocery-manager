# OpenAI Batch API cron — Skaffu

Routes **latency-insensitive** AI jobs through the [OpenAI Batch API](https://platform.openai.com/docs/guides/batch), which discounts input **and** output tokens by 50% in exchange for a ≤24h completion window. Interactive surfaces (receipt parse, smart fill, photo scan, recipe) keep the synchronous Responses API path unchanged.

**Off by default** — set `AI_BATCH_ENABLED=true` in App Hosting env to enable. Nothing submits until then.

**Related:** [FEATURE_FLAGS.md](./FEATURE_FLAGS.md) · [openai-budget.ts](../src/lib/domain/openai-budget.ts)

---

## Kinds

| Kind | Source (sync fallback) | What the batch does | Consumed by |
|------|------------------------|---------------------|-------------|
| `missing_expiry` | [`missing-expiry-batch.ts`](../src/lib/server/missing-expiry-batch.ts) (`inferMissingExpiryBatch`) | Pre-fills bäst-före dates for active pantry items missing `expiresOn`, across all households. Apply re-checks `expires_on IS NULL` → idempotent, no clobber. | Written straight to `inventory_items` |
| `expiry_push` | [`expiry-push-prompt.ts`](../src/lib/server/expiry-push-prompt.ts) (`generateExpiryPushBody`) | Pre-generates the weekly expiry-reminder push body per push-enabled user, keyed by recipient + item set. | `ExpiryReminderService` reads prebatched-first at send time |
| `admin_digest` | [`admin-insights.service.ts`](../src/lib/application/admin-insights.service.ts) (`getWeeklyDigestParagraph`) | Pre-generates the owner weekly PMF-digest paragraph. | `PmfDigestService` via `getWeeklyDigestParagraphPrebatchedFirst()` |

Each kind implements [`AiBatchKindHandler`](../src/lib/server/ai-batch/types.ts): `collect()` builds request lines + a `custom_id → target` payload; `apply()` consumes the output JSONL and returns the jsonb cached on the job row.

## Flow

`POST /api/cron/ai-batch` (auth: `Bearer $CRON_SECRET`) runs [`runAiBatchCycle`](../src/lib/server/ai-batch/runner.ts):

1. **Poll + apply** every in-flight job (`submitted`/`completed`). On upstream `completed` → download output → `handler.apply()` → mark `applied` + cache result → best-effort delete OpenAI files. A batch that never completes within 26h is aged out to `expired`.
2. **Submit** fresh work per enabled kind — one batch in flight per kind, cadence-guarded by `minResubmitHours` (missing_expiry 6h, expiry_push/admin_digest 18h). Uploads a JSONL of `/v1/responses` requests (same body as the sync path via `buildStructuredRequestBody`), creates the batch, persists an `ai_batch_job` row.
3. **Prune** terminal rows older than 7 days.

Jobs live in [`ai_batch_job`](../drizzle/0074_ai_batch_job.sql) (`payload` = custom_id → target map; `result` = cached output for consumers).

## Fallback (never blocks freshness)

The batch is a **pre-computation**, not a dependency. If it hasn't run, hasn't completed, or the item set changed since submission:

- **missing_expiry** — the interactive inventory load still calls `inferMissingExpiryBatch` synchronously for freshly-added items.
- **expiry_push** — a cache miss (changed item set) falls back to the synchronous nano call, then to the static translated body.
- **admin_digest** — no recent batch result → synchronous generation.

## Schedule

[`ai-batch-cron.yml`](../.github/workflows/ai-batch-cron.yml) — twice daily:

- **04:30 UTC** applies overnight batches before the 07:00 expiry reminders / 08:00 pmf-digest.
- **16:30 UTC** submits the day's work (≥14h before next-morning sends → completes inside the 24h window).

## Cost

`OPENAI_BATCH_ESTIMATED_USD_PER_KIND` in [openai-budget.ts](../src/lib/domain/openai-budget.ts) holds already-discounted per-request estimates (50% of the sync equivalent). These feed the runner's telemetry only — **not** the user-facing rate-limit budget (`OPENAI_ESTIMATED_USD_PER_KIND`), which still tracks interactive spend.

## Ops

- Enable: `AI_BATCH_ENABLED=true` in `apphosting.yaml` (deploy = publish).
- Disable / rollback: unset the flag (or `=false`). In-flight batches finish on OpenAI's side but nothing new submits; consumers fall back to sync.
- Requires `OPENAI_API_KEY`; without it the runner returns idle.
