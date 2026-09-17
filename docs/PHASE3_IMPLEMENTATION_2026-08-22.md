# Phase 3 — Portal Application Launcher

Date: 2026-08-22
Project: MyCar

## Implemented

- Authenticated `/` now redirects to `/portal` instead of `/dashboard`.
- Added `/portal` application launcher UI.
- Portal reads application access from the existing application-scoped role model through `getUserApplications()`.
- Added `src/modules/portal/context.ts` for shared portal/application context helpers.
- Re-exported portal application/context APIs from `src/modules/portal/index.ts`.
- Existing `/dashboard` remains unchanged and available as a compatibility route.
- Existing login, OAuth callback, session cookie and MyCar APIs remain unchanged.
- No database migration was required.

## Architecture

Provider ID / Health ID -> Identity module -> existing session -> Portal -> Application Catalog -> MyCar `/dashboard`

The portal launcher uses `Application.basePath` as the application entry point. For the existing MYCAR application this remains `/dashboard`.

## Verification

- `npm run build`: PASS
- TypeScript compilation: PASS as part of build
- Route generated: `/portal`
- Existing `/dashboard` routes still generated
- Existing `/api/v1/portal/applications` route still generated

## Important

This phase does not implement a cross-domain/global SSO cookie or external application handoff. It establishes the in-app portal launcher and application context while retaining the current MyCar session model. Cross-application SSO belongs to a later phase.
