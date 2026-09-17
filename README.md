# MyCar — ระบบขอใช้รถยนต์ โรงพยาบาลเกษตรวิสัย

Phase 1: Provider ID authentication + master data for drivers/vehicles + RBAC/audit foundation.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to PostgreSQL.
3. Set Health ID / Provider ID UAT credentials and registered redirect URI.
4. Generate Prisma Client:

```bash
npm run db:generate
```

5. Create database migration:

```bash
npm run db:migrate -- --name init
```

6. Seed roles/permissions:

```bash
npm run db:seed
```

7. Start development server:

```bash
npm run dev
```

## Provider ID callback

The registered redirect URI must exactly match `HEALTH_ID_REDIRECT_URI` and the URI registered with Health ID. The application uses the documented flow: Health ID authorization code -> Health ID token -> Provider ID token -> Provider Profile -> `organization[].hcode` validation.

## Initial super admin

Phase 1 intentionally does not hard-code a person as super admin. After the first allowed user logs in, promote that user to `SUPER_ADMIN` using a controlled database operation or an administrative bootstrap procedure before exposing user-role administration.

## Quality checks

```bash
npm run lint
npm run build
```

## Security notes

- OAuth client secrets remain server-side.
- Session tokens are stored as hashes in PostgreSQL and delivered in HTTP-only cookies.
- Application sessions expire after 30 minutes of inactivity.
- Provider/account identifiers are stored encrypted plus hashed for lookup.
- Public UUIDs are used for API/URL identifiers instead of internal database UUIDs.
- Audit logs omit credentials and tokens.
