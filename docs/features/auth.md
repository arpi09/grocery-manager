# Auth & profil

> Lucia v3 sessions, email/password, Google OAuth, email verification.

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/register` | Create account (+ Turnstile CAPTCHA) |
| `/forgot-password` | Request reset email |
| `/reset-password/[token]` | Set new password |
| `/verify-email` | Verification prompt |
| `/verify-email/[token]` | Confirm email |
| `/profile` | Legacy/simple profile |
| `/logout` | Session destroy (POST) |
| `/auth/google` | OAuth start |
| `/auth/google/callback` | OAuth callback |

## Flow

```mermaid
flowchart LR
  Register[/register]
  Verify[/verify-email]
  Hem[/hem?welcome=1]
  Login[/login]
  Register --> Verify
  Verify --> Hem
  Login --> Hem
```

## Key files

| Layer | File |
|-------|------|
| Services | `auth.service.ts`, `oauth.service.ts`, `email-verification.service.ts`, `password-reset.service.ts` |
| Infra | `src/lib/infrastructure/lucia.ts`, `user.repository.ts` |
| Hook | `src/hooks.server.ts` — session validation, `locals.user` |
| Routes | `src/routes/login/+page.server.ts`, `register/+page.server.ts` |

## Tests

- `src/lib/application/auth.service.test.ts`
- `src/lib/application/email-verification.service.test.ts`

## Common issues

- **Session not sticking:** cookie domain / `hooks.server.ts` session refresh.
- **OAuth redirect:** `/auth/google` + callback env vars in `.env.example`.
- **CAPTCHA on register:** [CAPTCHA.md](../CAPTCHA.md), `PUBLIC_TURNSTILE_SITE_KEY`.

## Related

- [settings.md](./settings.md) — account settings
- [onboarding.md](./onboarding.md) — post-register flow
