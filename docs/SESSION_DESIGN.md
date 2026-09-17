# Session Design Decision

## Next.js Server Components
`getCurrentUser()` is intentionally read-only with respect to the response cookie. It may be called from Server Components, where Next.js does not allow cookie mutation.

## Session timeout
The database session enforces a 30-minute inactivity timeout through `lastActivityAt` and `expiresAt`. The browser cookie is a session cookie; the server remains the source of truth for inactivity expiry.

## Cookie mutation
Cookie creation occurs in `createSession()`, which is called from the OAuth callback/Route Handler. Cookie deletion occurs in `destroySession()`, also used by the logout Route Handler.

This prevents `Cookies can only be modified in a Server Action or Route Handler` runtime errors while preserving server-side session invalidation.
