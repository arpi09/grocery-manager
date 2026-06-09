# Email deduplication audit (2026-06)

Brief audit of outbound email flows and the duplicate expiry-reminder root cause.

## Email flows

| Flow | Trigger | Dedup today | Duplicate risk |
|------|---------|-------------|----------------|
| **Expiry reminder** | Cron Mon 07:00 UTC + authenticated hook | `expiry_reminder_last_sent_at` (7-day interval) | **High** — race + hook on every request (fixed) |
| Household invite | Manual invite | Per invite token | Low |
| Email verification | Registration / resend | Token-based | Low (UI double-click possible) |
| Password reset | Forgot password | Per request | Expected |
| PMF weekly digest | Cron Mon 08:00 UTC | Weekly, owner only | Low |
| Error alert | Cron 30 min | Rate-limited in service | Low |
| Shopping push | Cron daily 06:00 | Push only (no email) | N/A |

## Root cause (expiry reminder)

Three interacting issues:

1. **`hooks.server.ts`** — `maybeSendReminderForUser` ran on **every** authenticated request, not once per session. Parallel tabs, SSR, and prefetch could each start a send path.
2. **Non-atomic dedup** — `processUserReminder` read `lastSentAt`, sent via Resend, then called `markReminderSent`. Concurrent callers could both pass the read before either wrote.
3. **Cron + active user** — Monday 07:00 cron plus same-day app use is fine when dedup works; with (1)+(2) users could get two emails minutes apart.

Sequence (before fix):

```
Request A ──► read lastSentAt (eligible) ──► send email #1 ──► mark sent
Request B ──► read lastSentAt (eligible) ──► send email #2 ──► mark sent
```

## Other flows

- **PMF digest** — separate subject/time (08:00 UTC); not the same bug.
- **Email + push** — two channels, one email (expected).
- **Multiple households** — one email with multiple sections (expected).

## Human verification (Resend)

If you have Resend dashboard access, search the recipient + subject containing “går snart ut” on the reported day. Two timestamps minutes apart confirms the race. Without API/dashboard access, rely on prod logs: `[email] Sending` and `[expiry-reminder]` around cron and user activity.

## Fix (implemented)

1. **Atomic claim** — `tryClaimReminderSend` conditional UPDATE on `expiry_reminder_last_sent_at`; revert on total send failure.
2. **Session-scoped hook** — cookie `hp_expiry_reminder_checked=1` (httpOnly) so the hook fires at most once per browser session.
3. **Tests** — parallel `maybeSendReminderForUser` asserts a single email send.

See [EMAIL.md](./EMAIL.md) and [90_DAY_ROADMAP.md](./90_DAY_ROADMAP.md) for current trigger and dedup behaviour.
