# West Ridge Rentals — launch checklist and backlog

Invoices, certificate-of-insurance uploads, and a manager role are now in the app. Production hosting is still not set up. Do not deploy, buy a domain, or change paid infrastructure until Sam approves a host and credentials.

The rental platform stays the operational system. A future public marketing site is a separate product and must read equipment, rates, and availability from this backend. It must not get its own equipment database.

## Production checklist

| Item | Current state | Needed before real data |
| --- | --- | --- |
| Hosting | Local Next.js only | A host Sam approves. Not selected. |
| Database | SQLite file (`DATABASE_URL=file:./dev.db`) | A hosted database. SQLite on one laptop is not a shared production store. |
| Domain | None | Sam’s domain choice. Do not purchase yet. |
| HTTPS | Dev server is HTTP | Terminate TLS on the host. Production must not use the LAN HTTP URL. |
| API URL | Mobile uses `EXPO_PUBLIC_API_URL`, then a saved server URL | Set the production URL in the mobile env at build time. Remove reliance on localhost, `10.0.2.2`, and the LAN fallback. |
| Secrets | `AUTH_SECRET` is required in production and rejects the dev default | Generate a long random secret. Do not commit it. |
| Sessions | Signed cookie and bearer token, 14 days | Keep the existing signer. Confirm cookie `Secure` on HTTPS before go-live. |
| Backups | None | Daily database backup and a tested restore. |
| Photos | Files in `public/uploads` on local disk | Object storage (or a persistent volume) plus backup. Do not put files in SQLite. |
| CORS | API and `/uploads` allow any origin | Restrict browser origins to the real site. Mobile bearer calls can stay allowed. |
| Monitoring | Console and skipped notifications when no provider is set | Error reporting and an uptime check on `/api/health`. |
| Recovery | Not written | Who restarts the app, where backups live, and how to restore photos. |
| iOS / Android | Same backend and roles | Production builds point at the production API. No separate mobile billing or status rules. |
| Users | Demo seed: `admin@rental.app` is Sam Carson with role `ADMIN` | Real accounts with passwords Sam sets. Do not ship `demo123`. |

## Decisions and credentials still needed from Sam

- Hosting provider and who pays for it.
- Domain name, and whether email (notifications) is in scope.
- Production database provider.
- Photo storage provider, or confirmation that a single server disk is acceptable for the first weeks.
- `AUTH_SECRET` and database URL, stored as host secrets.
- Real emails for Sam, Aaron, and Vinny. Passwords are set by them, not written into the repo.
- Whether Aaron (manager) may create rentals and see all customers, or only operate transports and equipment. Today only `ADMIN` can open owner screens. `EMPLOYEE` is field work. There is no `MANAGER` role.
- Whether Vinny’s “admin/developer” account is the existing `ADMIN` role (same access as Sam) or a separate account with the same role. Do not invent a weaker admin that bypasses checks.
- Notification provider, if pickup and delivery messages must actually send. Without one, the app records the event and skips the message.
- Who owns backups and what “restore” means on day one.

## Roles (not built yet)

Existing roles are only `ADMIN`, `EMPLOYEE`, and `CUSTOMER`. The owner UI is the `ADMIN` role. Sam Carson is the seeded admin.

Requested people:

- Sam Carson → owner. Maps to existing `ADMIN` until a separate owner name exists.
- Aaron → manager. Needs an explicit permission list before any new role is added. Do not give Aaron employee-only access if he must run the yard, and do not give him every admin screen by default.
- Vinny → admin/developer. Can use `ADMIN` if Sam wants the same access as the owner. Do not hardcode a password.

## Backlog (do not start until this plan is accepted)

1. Invoice payment status. Add invoice number, customer, rental, equipment, dates, line items, total, due date, and status `UNPAID` or `PAID`. Leave room for overdue, cancelled, and partial. Totals come from `calculateCharge` / `rentalCharge` and the rental’s stored `finalAmount`. Do not add a second calculator.
2. Rental detail shows its invoice and payment status. Customer profile lists invoice history. One invoice record per charge, linked to the rental.
3. Customer profile reads existing customer, contact, rentals, equipment, dates, duration, rate snapshots, photos, and notes. No copied history tables.
4. Certificate of Insurance: PDF upload on the customer, view/download, upload date, customer ownership. Store the file the same way other uploads will be stored in production (object storage or the existing uploads directory, not a blob column). Shape the record so other customer documents can be added later.
5. Damage history stays on the rental and equipment photo history: customer, equipment, dates, delivery, pickup, before/after photos, condition notes, damage notes, final charge, and the related invoice.
6. Future marketing site calls authenticated or public read APIs for equipment name, number, photos, description, rates, and availability. Quote requests are written into this platform. Do not build that site in this repo.

## Verification already run on the pushed commit

- Website TypeScript and `next build`
- Mobile TypeScript
- Unit tests (billing, photos, notifications, transports) and login validation
- API tests: health, auth, role checks, customer isolation, clock, delivery/pickup, customer pickup request
