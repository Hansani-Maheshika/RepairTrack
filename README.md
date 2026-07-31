# RepairTrack

RepairTrack is a TypeScript/Express/PostgreSQL API for managing customers, devices, repair jobs, staff workflows, and public repair tracking.

## Backend setup

Requirements: Node.js 22+, npm, and PostgreSQL 15+.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npx prisma migrate deploy
npm run seed
npm run dev
```

Set a secure `SEED_USER_PASSWORD` before seeding. The seed creates admin, receptionist, and technician accounts using the emails in `prisma/seed.ts`. The API listens on `http://localhost:5000`; health checks are `/api/v1/health` and `/api/v1/health/database`.

Alternatively, set secure secrets in `docker-compose.yml` and run `docker compose up --build`.

## Frontend setup

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5173`. Set `VITE_API_URL` to the running backend API, for example `http://localhost:5001/api/v1`.

The completed MVP frontend includes role-based login and navigation, customer and device management, repair intake and status history, technician assignments and inspections, public tracking, staff administration, and the admin dashboard. Quotations, inventory, invoices, and payments are future modules because they are not part of the current API/database schema.

Security note: npm currently reports a React Router advisory for RSC/server-action mode. RepairTrack is a client-only Vite SPA and does not use that mode; keep the router updated when a patched release is published.

## Commands

- `npm run dev` — development server
- `npm run typecheck` — Prisma generation and TypeScript checking
- `npm test` — fast unit tests
- `npm run test:integration` — real PostgreSQL API integration tests
- `npm run build` / `npm start` — production build and server
- `npm run seed` — create/update the three initial staff accounts
- `npm run seed:demo` — safely create reusable sample customers, devices and repairs
- `npm run tokens:cleanup` — remove expired and revoked refresh sessions
- `npx prisma migrate deploy` — apply committed database migrations

Frontend verification commands are `npm run lint`, `npm test`, and `npm run build` from the `frontend` folder.

Use a separate database in `DATABASE_URL` when running integration tests outside CI.

## Authentication and roles

Login returns a short-lived bearer access token and stores a rotating refresh token in an HTTP-only cookie. Send protected requests with `Authorization: Bearer <token>`.

- `ADMIN`: staff management, dashboard, and all repair operations
- `RECEPTIONIST`: customers, devices, repair intake/assignment, and collection statuses
- `TECHNICIAN`: only repairs assigned to that technician, including inspection and technical statuses
- Public customers: tracking only, using repair number and phone number

## API summary

All routes are under `/api/v1`.

| Method | Route | Access |
|---|---|---|
| GET | `/health`, `/health/database` | Public |
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` | Public/session |
| GET | `/auth/me` | Staff |
| PATCH | `/auth/password` | Staff |
| GET/POST | `/users` | Admin |
| GET | `/users/technicians` | Admin, receptionist |
| GET/PATCH | `/users/:id` | Admin |
| PATCH | `/users/:id/password` | Admin |
| GET/POST | `/customers` | Admin, receptionist |
| GET/PATCH | `/customers/:id` | Admin, receptionist |
| GET | `/customers/:id/devices` | Admin, receptionist |
| GET/POST | `/devices` | Admin, receptionist |
| GET/PATCH | `/devices/:id` | Admin, receptionist |
| GET | `/repairs`, `/repairs/:id` | Staff; technicians see assigned work only |
| GET | `/repairs/my-assigned` | Technician |
| POST/PATCH | `/repairs`, `/repairs/:id` | Admin, receptionist |
| PATCH | `/repairs/:id/assign` | Admin, receptionist |
| PATCH | `/repairs/:id/inspection` | Admin, assigned technician |
| PATCH | `/repairs/:id/status` | Staff subject to workflow/role rules |
| GET | `/dashboard/summary` | Admin |
| POST | `/public/repairs/track` | Public, rate-limited |

Successful responses use `{ success, message, data }`. Errors use `{ success: false, message, errors }`. Validation errors include field paths.

## Repair workflow

The normal flow is `DEVICE_RECEIVED → UNDER_INSPECTION → WAITING_FOR_CUSTOMER_APPROVAL → REPAIR_APPROVED → REPAIR_IN_PROGRESS → TESTING → READY_FOR_COLLECTION → COMPLETED → COLLECTED`. Waiting-for-parts, rejection, and cancellation branches are enforced by `src/utils/statusTransitions.ts`; collected and cancelled repairs are terminal.
