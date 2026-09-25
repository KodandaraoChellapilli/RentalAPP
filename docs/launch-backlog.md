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
| API URL | Mobile uses `EXPO_PUBLIC_API_URL`, then a saved server URL | Set `EXPO_PUBLIC_API_URL` for a production build. A production build fails if that variable is missing. Development may still use localhost, `10.0.2.2`, or the Expo LAN host. |
| Secrets | `AUTH_SECRET` is required in production and rejects the dev default | Generate a long random secret. Do not commit it. |
| Sessions | Signed cookie and bearer token, 14 days | Logout clears the website cookie and the phone deletes its saved token. A copied bearer token stays valid until it expires. There is no server-side revocation list. |
| Backups | None | Daily database backup and a tested restore. |
| Photos | Condition photos stay in `public/uploads` and require a signed URL | Persistent object storage or a volume that survives deploys, plus backup. Direct `/uploads` paths without a signature return 404. |
| Customer PDFs | `storage/private` (or `FILE_STORAGE_DIR`) | The same persistent store. This directory is not served as a public website path. |
| CORS | `CORS_ORIGINS` allowlist. Development allows localhost. Production ignores `*` | Set the real site origin when Sam chooses it. Do not leave production on a wildcard. |
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
- Whether Aaron (manager) may create rentals and see all customers, or only operate transports and equipment. The app now has a `MANAGER` role for yard work: dashboard, rentals, equipment, transports, customers, invoices, and insurance documents. Managers cannot manage employees, open reports, or create customer portal logins.
- Whether Vinny’s “admin/developer” account is the existing `ADMIN` role (same access as Sam) or a separate account with the same role. Do not invent a weaker admin that bypasses checks.
- Notification provider, if pickup and delivery messages must actually send. Without one, the app records the event and skips the message.
- Who owns backups and what “restore” means on day one.

## Roles

`ADMIN` is the owner. `MANAGER` runs the yard and cannot manage employees, reports, or customer portal logins. `EMPLOYEE` is field work. `CUSTOMER` sees only their own rentals, invoices, and documents.

Sam Carson is the seeded admin. Aaron and Vinny still need real accounts that Sam creates. Do not hardcode their passwords.

## Already in the app

Invoices, customer history, certificate-of-insurance PDFs, equipment history, the manager role, and the public equipment read API are implemented. Square is not connected. Hosting, a production database, persistent file storage, backups, and a domain are not set up.

## Production database

The current database is SQLite in `prisma/dev.db`. Invoice, invoice line, and customer document tables are already in that schema, including one invoice per rental. Do not treat that file as the production database. Production needs a hosted database Sam chooses, with backups. This audit does not migrate the database.

## Verification already run on the pushed commit

- Website TypeScript and `next build`
- Mobile TypeScript
- Unit tests (billing, photos, notifications, transports) and login validation
- API tests: health, auth, role checks, customer isolation, clock, delivery/pickup, customer pickup request
