# Security review notes

## Implemented controls

- HTTP-only Secure production refresh cookies with configurable SameSite and domain.
- Exact-origin credentialed CORS, Helmet security headers, HSTS in production and trusted-proxy configuration.
- Separate access/refresh secrets enforced in production.
- Authentication, password recovery and public tracking rate limits.
- Hashed refresh tokens and password-reset codes, short-lived access tokens, single-use reset codes and session revocation after password changes.
- Backend-enforced first-login password replacement.
- Backend-enforced fully paid invoice and receptionist role before collection.
- Authorization checks for technician repair images.
- Maximum 5 MB image uploads, MIME allowlist, binary signature validation, sanitized filenames, Cloudinary normalization and mandatory permanent cloud storage in production.
- Structured JSON request/error logs with authorization, cookies, passwords and reset codes redacted.
- Optional provider-neutral error-monitoring webhook without request bodies or credentials.

## Dependency review

The backend production dependency audit reports zero known vulnerabilities. The latest available `react-router-dom` release currently produces an npm advisory for React Server Components action handling. RepairTrack is a client-only Vite SPA and does not enable React Router Framework/RSC mode or server actions, so the affected execution path is not used. Keep React Router pinned to the reviewed version, monitor the advisory and upgrade when a patched release becomes available.

## External controls still owned by hosting

TLS certificates, firewall rules, database encryption, backup encryption, point-in-time recovery, Cloudinary account controls, verified email-domain controls, central log retention and monitoring alerts must be configured in the selected providers. No repository can create those accounts or credentials automatically.
