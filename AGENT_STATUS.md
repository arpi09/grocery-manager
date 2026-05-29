# Agent status

Live coordination board for parallel agents and feature branches.

**Related:** `OWNERSHIP.md` · `MULTITASK.md`

_Last verified: 2026-05-28 (local). Feature branch `feature/pantry-invites-roles` in progress._

---

## Coordinator rules

| Rule | Detail |
|------|--------|
| **Push** | Only after: `Approved to push [branch-name]` |
| **Dev runtime** | `dev:watch` in main worktree — no manual restart needed |

---

## Active feature branch

| Item | Value |
|------|--------|
| **Branch** | `feature/pantry-invites-roles` |
| **Scope** | Household roles (`owner` / `editor` / `viewer`), invite links, read-only viewers |
| **Migration** | `0007_household_invites_roles.sql` — map `member` → `editor`, add `household_invite` |

### Roles

| Roll | Behörighet |
|------|------------|
| **Ägare** | Bjud in, ändra roller, ta bort medlemmar, redigera inventering |
| **Redigera** | Lägga till/ändra/radera varor |
| **Visa** | Endast läsa inventering |

### UI

- **Inställningar → Delat hushåll** — medlemmar, inbjudningar, rollhantering (ägare)
- **`/invite/[token]`** — acceptera inbjudan (publik sida, inloggning med rätt e-post)

### Verify locally

1. Logga in som ägare → Inställningar → skapa inbjudan, kopiera länk
2. Öppna länken i inkognito / annat konto → acceptera
3. Sätt användare till **Visa** → försök lägga till vara (ska nekas)

---

## Base branch

| Item | Value |
|------|--------|
| **master / origin.master** | `5d8b498` — integrated E2E, household scope, profile, analytics, nav redesign, theme |

---

## PGlite migrations (incremental)

`0003_household` → `0004_user_profile` → `0005_app_error` → `0006_user_theme_preference` → **`0007_household_invites_roles`**

Idempotent runner in `init.ts`. After pull on old PGlite data: remove `data/pantry/` once if migrations fail.

---

## Env vars (local dev)

Set in `.env` (see `.env.example`):

- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded admin
- `DEFAULT_MEMBER_EMAIL` / `DEFAULT_MEMBER_PASSWORD` — shared household demo member (seeded as **editor**)
- `USE_PGLITE=true` — local embedded DB

---

## Other branches (parallel)

| Branch | Status |
|--------|--------|
| `feature/firebase-deploy` | Firebase deploy docs/setup (separate agent) |
| `fix/logout-500` | Logout fix (ready to merge when approved) |
