-- Email verification feature cutoff: 2026-06-01T00:00:00Z (migration 0027).
-- Accounts created before this date were not required to verify via email.
-- OAuth users are backfilled because the provider already verified the address.
UPDATE "user" AS u
SET email_verified_at = u.created_at
WHERE u.email_verified_at IS NULL
  AND u.created_at < TIMESTAMPTZ '2026-06-01 00:00:00+00'
  AND EXISTS (
    SELECT 1
    FROM oauth_account AS o
    WHERE o.user_id = u.id
  );
