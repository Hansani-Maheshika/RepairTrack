# Staging and production runbook

## Required services

- A managed PostgreSQL database with automated daily backups and point-in-time recovery.
- A backend host supporting Node.js 22 and HTTPS.
- A static frontend host or container behind HTTPS.
- A verified Resend domain and API key.
- A Cloudinary account with signed server-side uploads.
- Central log storage and an alert for repeated HTTP 5xx responses.

## Required production variables

Set `NODE_ENV=production`, `DATABASE_URL`, unique 32+ character `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`, HTTPS `CLIENT_URL` and `PUBLIC_API_URL`, `RESEND_API_KEY`, verified `EMAIL_FROM`, and all three `CLOUDINARY_*` values. Configure `COOKIE_SAME_SITE` and `COOKIE_DOMAIN` for the selected domains. Never place secrets in frontend variables or Git.

Set `ERROR_WEBHOOK_URL` to an HTTPS webhook owned by the selected monitoring provider. Unhandled API errors are sent without request bodies, cookies or authorization headers; structured logs remain the fallback.

For the simplest cookie setup, deploy the frontend and API under the same site, for example `app.example.com` and `api.example.com`, and use `COOKIE_SAME_SITE=lax`. Use `none` only for genuinely cross-site deployment; production cookies are already Secure and HTTP-only.

## Staging sequence

1. Create a separate staging database, Resend sender and Cloudinary folder/account.
2. Deploy the backend and run `npx prisma migrate deploy`.
3. Deploy the frontend with `VITE_API_URL` pointing to the staging HTTPS API.
4. Confirm `/api/v1/health` and `/api/v1/health/database` return success.
5. Run `npm run test:integration` against the staging-like test database, never against production.
6. Complete every item in `docs/manual-acceptance-test.md` on desktop and mobile.
7. Send a real password verification email and upload/view a real image.
8. Create and verify a database backup before approving production deployment.

## Production operation

Schedule `scripts/backup-postgres.ps1` daily if the database provider does not already provide stronger managed backups. Run `scripts/verify-backup.ps1` on each new backup and perform a test restore to an isolated database at least quarterly. Retain application logs centrally and alert on health-check failures and 5xx error spikes.

Deploy migrations before routing traffic to a new backend version. Roll back application versions through the hosting platform; never run destructive schema rollback commands against production without a reviewed recovery plan.
