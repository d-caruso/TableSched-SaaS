# ADR-001 — Session vs JWT Authentication

Status: **Accepted** — keep server-side sessions for the web/platform app; keep JWT for native.
Date: 2026-06-02
Scope: `tablesched-saas` (and its relationship to the `tablesched` core auth stack).

References:
- Repo: [`../README.md`](../README.md)
- Platform API auth: `backend/apps/platform/views.py` (`_PLATFORM_AUTH = [SessionAuthentication]`)
- Platform-staff check: `backend/apps/platform/permissions.py` (`IsPlatformStaff`)
- Core JWT plumbing: `apps.common.authentication.AllauthJWTAuthentication`,
  allauth headless `JWTTokenStrategy`
- Core architecture: `TableSched/docs/ARCHITECTURE_OVERVIEW.md` (Staff authentication)

---

## Context

The question arose while designing the authenticated `GET /api/v1/me/` identity endpoint:
should the web/platform app keep Django's session authentication, or migrate to JWT —
and would JWT make the app safer, or is it cadence-following ("hype")?

Current, verified state of the stack:

- **Sessions are baked into Django** — `django.contrib.sessions` + `AuthenticationMiddleware`.
  The server stores session state (DB/cache); the browser holds only an opaque `sessionid`
  cookie.
- **JWT already exists in the stack** — allauth headless `JWTTokenStrategy` +
  `AllauthJWTAuthentication`. It is used by the **app/native** client.
- **The SaaS platform API is session-based** — every endpoint in
  `apps/platform/views.py` sets `authentication_classes = [SessionAuthentication]`, and the
  SaaS test settings prepend `SessionAuthentication`.

So this is **not** a sessions-xor-JWT choice. Both mechanisms are present; the decision is
*which client surface uses which*.

## Decision

- **Web / platform-admin app → server-side sessions** (HttpOnly cookie). This is what the
  backend already enforces; keep it.
- **Native / mobile (Expo, React Native) → JWT** stored in `SecureStore`. Right tool for a
  surface with no cookie jar.
- **Do not migrate the web app to JWT "for safety."** It would not make the app safer and
  would remove instant revocation while adding token-theft exposure.

## Rationale — would JWT make the web app safer?

No. For a browser app talking to its own backend, JWT is generally **less** safe than
server-side session cookies. JWT's real value is scalability and cross-service/native auth,
not browser security.

| Concern | Server sessions (cookie) | JWT |
|---|---|---|
| **Revocation** | Instant — delete the session row; fired staff lose access immediately. | Hard — token is valid until expiry. A revocation blocklist reintroduces the server-side state JWT was meant to avoid. |
| **XSS token theft** | `sessionid` in an **HttpOnly** cookie is unreadable by JS → XSS cannot exfiltrate it. | In `localStorage`/`sessionStorage` (JS-readable) an XSS steals it outright. In an HttpOnly cookie → effectively back to cookies + CSRF, but now with a non-revocable token. |
| **CSRF** | Real risk, mitigated by Django CSRF tokens + `SameSite` cookies. | Statelessness does not avoid CSRF if the JWT is stored in a cookie. |
| **What it actually buys** | — | Stateless horizontal scaling, cross-service/cross-domain auth, and clients without a cookie jar (native/mobile). |

The OWASP-aligned position: for a server-rendered/SPA web app against its own backend,
**HttpOnly session cookies are the safer default**, primarily because of immediate
revocation and XSS resistance.

## Why the app legitimately still uses JWT

The product is a **hybrid**: the Expo app runs on **native** (React Native + `SecureStore`),
where there is no cookie jar and a token in secure device storage is the correct mechanism.
That is the valid reason the app client uses JWT — not a security upgrade over sessions.

> Note / known wrinkle: the core architecture currently stores the **web** JWT in
> `sessionStorage`, which is JS-readable (the less-safe option). This reinforces that the
> web surface should lean on sessions, not JWT. There is also a transport inconsistency to
> reconcile separately: the core web client (`frontend/lib/api/client.ts`) sends
> `Authorization: Bearer …`, while the SaaS platform API authenticates by session.

## Consequences

- `GET /api/v1/me/` and other SaaS web endpoints use `SessionAuthentication`, consistent
  with the existing platform API. The endpoint is **authenticated/private** but
  **public-schema** (no tenant context) — those are independent properties.
- The endpoint is auth-agnostic in design: a future web→JWT migration would change a single
  `authentication_classes` line, nothing structural.
- A web sessions→JWT migration, if ever pursued, is a **separate architectural initiative**
  (revocation strategy, token storage, CSRF/XSS posture, transport unification) and must not
  ride along with feature work.

## Alternatives considered

1. **Migrate web app to JWT** — rejected: no security gain, loses instant revocation, adds
   XSS exposure when stored in JS-accessible storage.
2. **Embed `platformAdmin` in the login response/JWT to avoid a `/me/` call** — rejected on
   layering grounds: login is core's allauth endpoint and `platformAdmin` is a SaaS concept;
   embedding couples core to SaaS and mixes authentication with authorization. (Under
   sessions the token-staleness objection is moot, but the layering objection stands.)
