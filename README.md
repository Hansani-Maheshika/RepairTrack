# RepairTrack

RepairTrack is a full-stack repair-centre system built with React, TypeScript, Express, Prisma and PostgreSQL.

## Run locally

Requirements: Node.js 22+, npm and PostgreSQL 15+.

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npx prisma migrate deploy
npm run seed
npm run seed:demo
npm run dev
```

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

Open `http://localhost:5174`. RepairTrack intentionally uses port 5174 so another project can keep port 5173. The API normally runs at `http://localhost:5001`; use the actual `PORT` in `backend/.env`. A JSON `Route not found: GET /` response at the API root is normal—use `/api/v1/health` or open the frontend.

Set `SEED_USER_PASSWORD` in `backend/.env` to a password of your choice before `npm run seed`. The three development accounts are `admin@repairtrack.local`, `receptionist@repairtrack.local`, and `technician@repairtrack.local`, all using that password. Never commit `.env`.

## Real-world workflow and permissions

1. Receptionist creates the customer, device and repair. Admins receive an in-app notification.
2. Admin assigns an active technician. That technician receives a notification.
3. Technician records inspection findings, progresses technical statuses and records used parts.
4. Receptionist creates and sends a quotation. The customer opens its secure link without an account and approves or rejects it.
5. After repair completion, reception creates the invoice. The customer views it and pays at the counter.
6. Technician repairs, tests and marks the device ready. Receptionists receive a notification.
7. Reception records full payment, hands over the device and marks it collected. Collection is blocked until the invoice is fully paid.

Admins manage staff, technician assignments, inventory stock and audit logs. Receptionists manage customer-facing intake, quotations, payments and collection, and can view part availability. Technicians only access assigned repair work, view inventory and record parts used. Customers do not need a login; tokenized quotation/invoice links and public tracking are used.

## Added business modules

- In-app notifications with read/unread state
- Quotations with line items, customer approval/rejection and expiring public links
- Spare-parts inventory, stock adjustments and repair usage
- Invoices and receptionist-recorded counter payments
- Email through Resend and SMS through Notify.lk
- JPEG, PNG and WebP repair images with content-signature validation (maximum 5 MB); Cloudinary is mandatory in production
- Staff password recovery on the login page using a hashed, expiring, single-use six-digit verification code; no reset link or dashboard password section is used
- Technician spare-part requests with admin notifications, stock replenishment, request resolution and automatic inventory reduction when parts are used
- Audit logs for important business operations

External services are optional only for local development. Production startup requires Resend email, Cloudinary storage, HTTPS client/API URLs and separate strong JWT secrets. Without Resend, the development password-reset screen displays the verification code. Without Cloudinary, development uploads are saved under `backend/uploads`.

## Important routes

- Authentication: `/api/v1/auth/*`, `/api/v1/password/*`
- Repairs: `/api/v1/repairs/*`; assignment is admin-only, inspection technician-only
- Notifications: `/api/v1/notifications`
- Quotations: `/api/v1/repairs/:id/quotations`, `/api/v1/quotations/:id/send`
- Inventory: `/api/v1/inventory`, `/api/v1/repairs/:id/parts`
- Invoices/payments: `/api/v1/invoices`, `/api/v1/invoices/:id/payments`
- Attachments: `/api/v1/repairs/:id/attachments`
- Public tracking/quotation/invoice: `/api/v1/public/*`
- Admin audit log: `/api/v1/audit-logs`

## Verification

Backend: `npm run typecheck`, `npm test`, `npm run test:integration`, and `npm run build`.

Frontend: `npm run lint`, `npm test`, and `npm run build`.

The Docker alternative is `docker compose up --build`; production values must be supplied rather than committed. See `docs/staging-and-production.md`, `docs/manual-acceptance-test.md`, and `docs/privacy-and-retention.md` before deployment.
