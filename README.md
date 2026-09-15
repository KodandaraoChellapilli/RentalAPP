# Ridgeline Rentals

Ridgeline Rentals is an equipment rental operations system for a yard that rents machines (excavators, skid steers, trailers, lifts, compactors) to construction customers.

It solves the gap between a basic inventory list and real yard work. The same application is used by the owner, employees, and customers, with different permissions:

- The owner sees the whole yard: what is on rent, what is due today, who is clocked in, and what the current estimated charges are.
- Employees clock in for **work time**, complete assigned deliveries and pickups, and photograph machine condition.
- Customers log in and see **only their company's** equipment, rentals, charges, pickup schedule, and permitted photos.

Employee work hours are tracked separately from rental duration. Delivering a machine starts the rental timer. Picking it up stops the timer, stores a final charge, and returns the machine to Available, Maintenance, or Out of Service.

This repository folder (`Rental_App`, also referred to as `rental_app`) **is the product**. It is not a real-estate application.

The Expo phone app lives in `rental-mobile/` inside this same repository. It consumes the JSON APIs under `/api` and does not redefine billing or status rules.

---

## Project overview

A rental yard needs one record per machine (for example Equipment #306, Mini Excavator), a live rental while that machine is on a jobsite, photo proof of condition, and a customer-facing estimate that is clearly not a final invoice until pickup.

Ridgeline Rentals keeps:

- Equipment identity (number, name/type, rate, billing unit, status, notes)
- Rental records (scheduled / active / completed, start, expected pickup, actual pickup, rate snapshot, estimated and final charges)
- Delivery and pickup jobs on a calendar, with employee assignments
- Timestamped **before delivery / initial condition** and **after pickup / return condition** photos stored on disk and linked to equipment, rental, event, and employee
- A customer portal limited to that customer’s rentals

---

## Core features

### Owner / Admin dashboard

The owner dashboard (`/admin/dashboard`) is a yard operations screen, not a generic CRUD home page. It includes:

- Active rentals and scheduled rentals
- Available equipment
- Scheduled deliveries and pickups
- Today’s jobs
- Employees clocked in (work time, not rental time)
- Current estimated rental charges (active rentals only)
- Equipment needing attention (Maintenance / Out of Service)
- Open assignments, including overdue jobs

Dashboard numbers come from `src/lib/queries/dashboard.ts`. Charge totals use `src/lib/billing.ts`.

### Equipment management

Owners can add, edit, and view equipment. Each machine has:

- Equipment number (unique, for example `306`)
- Name and type
- Status
- Rental rate and billing unit (hourly, daily, or weekly)
- Current customer / current rental when one is open
- Description / maintenance notes
- Condition & Photo History (before delivery and after pickup for every rental)
- Rental billing history
- Delivery and pickup history

### Equipment statuses

| Status | Meaning |
| --- | --- |
| Available | In the yard and ready to go out. Chosen after pickup only when the equipment is in good condition. |
| Scheduled | A delivery/rental has been scheduled |
| Active / On Rent | Delivered; rental timer is running |
| Pickup Scheduled | An active rental has a pickup job scheduled |
| Maintenance | Returned but not rentable until inspected or repaired |
| Out of Service | Returned and taken out of the fleet |

### Equipment details and history

`/admin/equipment/[id]` shows machine information, the current rental and live charge, a dedicated **Condition & Photo History** section (before vs after for every rental, with employee, date/time, customer, and notes), rental billing history, and calendar assignments.

### Rentals

Rentals are first-class records (`Rental` in Prisma), not just calendar labels. Statuses:

- **Scheduled** — created when a delivery is scheduled; timer has not started
- **Active** — delivery completed; `startAt` is set; estimated current charge is live
- **Completed** — pickup completed; `endAt` and `finalAmount` are stored
- **Cancelled** — not billed

The rentals page (`/admin/rentals`) filters scheduled, active, and completed jobs and shows duration plus amount.

### Rental timer

The timer starts when delivery is submitted (`completeDelivery` sets `rental.startAt` to now). It stops when pickup is submitted (`completePickup` sets `rental.endAt` to now). Active rentals use “now” as the end time for estimates. The UI refreshes estimates about every 15 seconds via `LiveCharge`.

### Hourly / daily / weekly billing

Each equipment record has a rate and a billing unit. When a rental is created, those values are copied onto the rental (`rateSnapshot`, `billingUnitSnapshot`) so later rate changes do not rewrite history.

- **Hourly** — billed units = `ceil(duration / 1 hour)`, minimum 1 hour once started
- **Daily** — billed units = `ceil(duration / 1 day)`, minimum 1 day once started
- **Weekly** — billed units = `ceil(duration / 7 days)`, minimum 1 week once started

Amount = billed units × the rental’s snapshot rate.

### Estimated Current Charge

While status is `ACTIVE`, the amount is labeled **Estimated Current Charge**. It is not treated as a final invoice.

### Final rental charge

On pickup, `calculateCharge(startAt, pickupTime, rateSnapshot, billingUnitSnapshot)` runs once. The result is stored as `finalAmount`. Completed rentals display **Final Rental Amount** from that stored value.

### Deliveries

Employees (and owners) complete deliveries at `/employee/deliver`. This is a required inspection workflow, not a generic upload button:

1. Open the assigned delivery
2. See equipment number, name, customer, rental, and delivery location
3. Physically inspect the equipment
4. Take / upload **Before delivery / Initial condition** photos (at least one required; multiple allowed; camera on phones)
5. Record condition notes (required)
6. Confirm the equipment condition
7. Complete delivery

That starts the rental, sets equipment to **Active / On Rent**, and permanently stores the photos with the equipment, rental, customer, delivery event, employee, date/time, and notes.

Owners also manage delivery jobs at `/admin/deliveries` and schedule them from `/admin/schedule/new` or the calendar.

### Pickups

`/employee/pickup` is the matching return inspection:

1. Open the active rental
2. See equipment and customer information, including the original before-delivery photos
3. Physically inspect the equipment after it returns
4. Take / upload **After pickup / Return condition** photos (at least one required)
5. Record condition notes (required)
6. Report whether there is damage or an issue
7. Confirm the equipment condition
8. Complete pickup

That completes the rental, stores the final amount, attaches after photos, and sets equipment status. If damage or an issue is reported, the equipment **cannot** be set to Available — only Maintenance or Out of Service.

### Required equipment condition photos

**Before delivery → Before photos → Rental (Active / On Rent) → Pickup → After photos → Condition assessment → Equipment status**

Photos are required to complete delivery and pickup. See [Photo documentation](#photo-documentation).

### Equipment condition notes

Delivery and pickup forms store condition notes on the rental, the completed schedule event, and each photo in that upload batch.

### Calendar / scheduling

`/admin/calendar` shows deliveries, pickups, rentals, and employee assignments. Owners create jobs at `/admin/schedule/new` and can assign employees.

### Employee assignments

Schedule events have an optional `employeeId`. Employees see assigned open jobs at `/employee/jobs`. Completing a job updates the linked rental and equipment.

### Employee clock in / out and work history

`/employee/clock` is **work time only**. It is not rental duration.

- Clock in / clock out
- Today’s hours
- Weekly hours
- Recent punch history

Owners review crew time at `/admin/hours` and on the dashboard (“Employees clocked in”).

### Customer portal

Customers use `/customer/rentals` and `/customer/rentals/[id]`. They see their own:

- Equipment on rent
- Active and historical rentals
- Rental start, rate, billing unit
- Estimated Current Charge or final amount
- Pickup schedule
- Delivery/before and pickup/after photos for those rentals

### Customer data isolation

- Middleware blocks customers from `/admin` and `/employee`.
- Customer rental queries are scoped to `user.customerId`.
- Opening another company’s rental id returns **404**.
- Photos on a customer page are loaded through that rental, not a global gallery.

Uploaded files live under `/uploads/...` on local disk. Guessing a file URL is a limitation of local storage; the application does not list another customer’s rentals or photos in the UI.

### Reports

`/admin/reports` summarizes estimated current charges, completed rental amounts, crew hours for the week (separate from rentals), and equipment counts by status.

### Maintenance / Out of Service

Pickup can send a machine to Maintenance or Out of Service. The owner dashboard highlights those machines so they are not treated as available.

### Role-based access

See [User roles](#user-roles). Layouts call `requireUser` with the allowed roles. Middleware also enforces path prefixes.

### Confirmation dialogs

Destructive or yard-state changes (delivery start, pickup complete, clock out) go through `ConfirmForm` / `ConfirmDialog`.

### Responsive UI

Desktop uses a **permanent left sidebar** (260px) plus header and main content. Below `lg`, the sidebar becomes a drawer; a bottom nav is shown on small screens.

### Authentication

Email + password (bcrypt). A signed HTTP-only cookie (`rental_session`) holds the session. `AUTH_SECRET` is used to HMAC the cookie. Sessions last 14 days. There is no third-party auth provider.

---

## User roles

### Owner / Admin

Full access. Navigation: Dashboard, Rentals, Equipment, Calendar, Deliveries, Pickups, Customers, Employees, Time Clock, Reports, Settings.

Can:

- Manage equipment, rates, billing units, and status
- Manage customers and portal logins
- Manage employees
- Schedule deliveries, pickups, and rentals
- Assign employees
- View all photos, notes, current estimates, and final charges
- View reports and crew hours
- Complete deliveries/pickups if needed (same forms employees use)

### Employee

Navigation: Time Clock, Today’s Jobs, Deliveries, Pickups, Equipment, Settings.

Can:

- Clock in and out; see today’s and weekly hours
- See assigned jobs
- Complete deliveries (equipment, customer, destination, before photos, notes)
- Complete pickups (after photos, notes, after-status)
- See machines tied to assigned jobs

Cannot manage rates, customers, or other companies’ records.

### Customer

Navigation: My Rentals, Settings.

Can:

- See only their company’s rentals and equipment
- See rental status, rate, start time, pickup schedule
- See Estimated Current Charge while on rent
- See rental history and final amounts
- See permitted before/after photos for those rentals

Cannot see other customers, employees, yard-wide inventory, or admin reports.

---

## Equipment lifecycle

```
Available
    → Scheduled          (owner schedules a delivery / rental)
    → Delivered / Active (employee completes delivery; timer starts)
    → Pickup Scheduled   (owner schedules pickup on an active rental)
    → Picked up          (employee completes pickup; timer stops)
    → Available | Maintenance | Out of Service
```

**Delivery** (`completeDelivery` in `src/lib/actions/rentals.ts`):

- Requires equipment, customer, destination, at least one before-delivery photo, condition notes, and condition confirmation
- Sets rental `status = ACTIVE` and `startAt = now`
- Copies equipment rate/unit onto the rental if a new rental is created
- Saves **Before delivery / Initial condition** photos
- Sets equipment `status = ON_RENT` (Active / On Rent)
- Completes or creates a `DELIVERY` schedule event

**Pickup** (`completePickup`):

- Requires an active rental with `startAt`, at least one after-pickup photo, condition notes, condition confirmation, and a damage/issue answer
- Calculates `finalAmount` from start → now using the snapshot rate/unit
- Saves **After pickup / Return condition** photos
- Sets rental `status = COMPLETED`, `endAt = now`
- Sets equipment to Available, Maintenance, or Out of Service
- If the employee reports damage or an issue, Available is not allowed — status becomes Maintenance or Out of Service
- Completes or creates a `PICKUP` schedule event

Scheduling a delivery on an available machine sets equipment to **Scheduled**. Scheduling a pickup on an active rental sets equipment to **Pickup Scheduled**.

---

## Rental billing

Implementation lives in `src/lib/billing.ts`. Pages and cards must not invent their own math. `LiveCharge` is a small client wrapper that re-runs `rentalCharge` while a rental is active.

### When the rental starts

`startAt` is set at delivery submit time, not when the calendar event was created.

### When the rental ends

`endAt` is set at pickup submit time. That timestamp is the billing end.

### Hourly, daily, weekly

`calculateCharge(start, end, rate, unit)`:

- Duration is `max(0, end - start)`
- Units round **up** (`Math.ceil`)
- A started rental bills at least one unit
- Amount is rounded to cents (`roundMoney`)

### Estimated Current Charge

`rentalCharge(..., status = "ACTIVE")` uses `end = now` and `isEstimate = true`.

Scheduled or cancelled rentals estimate **$0** (timer has not started).

### Final charge

`rentalCharge(..., status = "COMPLETED", finalAmount)` returns the stored `finalAmount` and `isEstimate = false`. The amount written at pickup is `calculateCharge(startAt, pickupNow, rateSnapshot, billingUnitSnapshot).amount`.

### Tests

```bash
npm test
```

This runs `src/lib/billing.test.ts` (hourly round-up, daily uses the equipment rate, weekly round-up, active estimates, completed uses stored final amount).

---

## Photo documentation

Photos are a **required step in delivery and pickup**, not a generic upload control somewhere in the app.

```
Assigned delivery
  → Inspect equipment
  → Take/upload BEFORE DELIVERY / INITIAL CONDITION photos
  → Condition notes
  → Confirm condition
  → Complete delivery
  → Rental starts (Active / On Rent)

Active rental
  → Inspect after return
  → Take/upload AFTER PICKUP / RETURN CONDITION photos
  → Condition notes
  → Report damage if necessary
  → Confirm condition
  → Complete pickup
  → Final charge calculated
  → Equipment = Available / Maintenance / Out of Service
```

**At least one photo is required before completing delivery and at least one photo is required before completing pickup.** Multiple photos are allowed so the employee can photograph front, back, sides, attachments, engine/important areas, and any damage. Phones can use the camera directly (`capture="environment"`). The form shows previews before submit.

Photos are first-class records (`Photo` in Prisma) and files on disk under `public/uploads/`. They are **not** CSS placeholders and **not** remote stock images. Uploads go through `src/lib/photos.ts` (`savePhotos`). Max request size for server actions is **12 MB** (`next.config.ts`).

### Before delivery / Initial condition

Taken in the delivery workflow before the equipment leaves. Each photo is stored with:

- Equipment and equipment number
- Rental
- Customer
- Delivery event (`eventId` → `ScheduleEvent`)
- Employee (`uploadedById`)
- Date/time (`takenAt`)
- Type `DELIVERY`
- Condition notes

Purpose: **this is the condition of the equipment before the customer received it.**

### After pickup / Return condition

Taken in the pickup workflow after the equipment comes back. Each photo is stored with:

- Equipment, rental, customer, pickup event, employee, date/time
- Type `PICKUP`
- Condition notes (prefixed with a damage flag when an issue is reported)

Purpose: **this is the condition of the equipment when it came back.** The original before-delivery photos stay attached to that rental.

### After pickup, equipment status

The employee/owner must choose status. Damaged equipment is not automatically made available:

- Good condition → **Available**
- Needs inspection/repair → **Maintenance**
- Seriously damaged or unavailable → **Out of Service**

### Viewing photos later

- **Equipment details** (`/admin/equipment/[id]`): `EquipmentConditionHistory` is the dedicated Condition & Photo History. Each rental shows before photos, after photos, condition notes, delivery employee, pickup employee, delivery date/time, pickup date/time, customer, and rental so the owner can compare condition.
- **Pickup form**: shows the original before-delivery photos while the employee takes return photos.
- **Customer rental detail**: the same before/after split, **only for that customer’s rental**. Customers cannot open another customer’s equipment or photos.

Reusable modules: `EquipmentPhotoUpload`, `EquipmentPhotoGallery` (`PhotoGallery`), `BeforeDeliveryPhotos`, `AfterPickupPhotos`, `ConditionNotes`, `EquipmentConditionHistory`. UI → `completeDelivery` / `completePickup` → `savePhotos` → `public/uploads` + Prisma `Photo`.

Demo seed writes labeled SVG files into `public/uploads` so history screens are not empty. Those are sample documentation files on disk. New deliveries and pickups store the **actual files** the employee selected (JPEG, PNG, WebP, and similar).

---

## Technical architecture

| Layer | Choice |
| --- | --- |
| App framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4, shared utility classes in `src/app/globals.css` |
| Data | Prisma 6 + SQLite (`DATABASE_URL=file:./dev.db`) |
| Auth | Email/password (bcryptjs), HMAC-signed cookie session |
| Validation | zod (forms/actions where used), required fields on yard forms |
| Dates | date-fns where week boundaries are needed; display helpers in `src/lib/utils.ts` |
| Icons | lucide-react |

There is no separate REST API server. Mutations are **Next.js Server Actions** in `src/lib/actions/`. Pages are server components that query Prisma. Interactive pieces (live charges, catalogs, photo file input, confirm dialogs) are client components.

### Billing module

`src/lib/billing.ts` — `calculateCharge`, `rentalCharge`, `formatMoney`, `formatRate`, `formatDuration`.

### Query / data modules

- `src/lib/queries/dashboard.ts` — owner dashboard aggregations
- `src/lib/photos.ts` — save files, create `Photo` rows, FormData helpers
- `src/lib/photo-labels.ts` — before/after labels and photo-area guidance (safe for client components)
- `src/lib/jobs.ts` — employee/admin job URLs and equipment labels
- `src/lib/nav.ts` — role-based sidebar config and page titles
- `src/lib/constants.ts` — statuses, billing units, labels

### Reusable components

Layout: `AppShell`, `AppSidebar`, `AppHeader`, `MobileNav`.

Cards / lists: `StatCard`, `RentalCard`, `JobCard`, `EquipmentCard`, `EquipmentCatalog`, `RentalsTable`, `JobsTable`.

Photos: `EquipmentPhotoUpload`, `PhotoGallery` (`EquipmentPhotoGallery`), `BeforeDeliveryPhotos`, `AfterPickupPhotos`, `ConditionNotes`, `BeforeAfterPhotos`, `EquipmentConditionHistory`. Yard workflow: `WorkflowSteps`, `JobSummary`.

Other: `LiveCharge`, `StatusBadge`, `ConfirmForm`, `Panel`, `Field`, `EmptyState`, `FilterToolbar`.

### Shared layout and sidebar

Authenticated routes wrap `AppShell`. The left sidebar stays mounted while navigating. `nav.ts` defines **different menus per role**; employees and customers never see owner-only links.

### Testing

Node’s test runner via `tsx` (`npm test`), currently billing.

---

## Project structure

```
Rental_App/
  prisma/
    schema.prisma          Database models
    seed.ts                Demo customers, equipment, rentals, photos, punches
    dev.db                 Local SQLite file (gitignored)
  public/uploads/          Stored equipment photos
  src/app/
    admin/                 Owner pages (dashboard, equipment, rentals, calendar, …)
    employee/              Clock, jobs, deliver, pickup, equipment
    customer/              Customer rentals portal
    account/               Settings
    login/                 Sign in
    api/                   JSON APIs for the Expo phone app (Bearer token or website cookie)
  src/components/
    layout/                Sidebar, header, mobile nav
    photos/                Upload, gallery, before/after, equipment history
    cards/                 Rental, job, equipment cards
    lists/                 Catalogs and tables
    dashboard/             Owner dashboard view
    ui/                    Panel, buttons, empty states, confirm dialog
  src/lib/
    actions/               Server actions (auth, rentals, equipment, people, timeclock) wrapping shared services
    services/              Shared delivery, pickup, clock, and login logic used by the website and JSON APIs
    api/                   JSON helpers, serializers, and role checks for `/api/*`
    billing.ts             Charge math
    photos.ts              Photo storage
    queries/               Dashboard data
    session.ts             Cookie session helpers
    nav.ts                 Navigation
  .env.example             Required environment variables
  README.md                This file
```

---

## Installation

From the `Rental_App` directory:

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is already in use, start on another port:

```bash
npm run dev -- -p 3001
```

For a phone on the same Wi-Fi, bind all interfaces:

```bash
npm run dev:lan
```

Then use your computer’s LAN address in the mobile app, for example `http://192.168.1.20:3001`.

---

## Mobile app (iPhone / Android)

The website is unchanged for computers. `rental-mobile` (sibling folder) is a React Native + Expo app that calls the same backend.

It does **not** calculate rental charges or decide equipment status. The phone sends clock punches and delivery/pickup photos; `src/lib/services/` and `src/lib/billing.ts` apply the existing rules.

### JSON APIs

Auth uses the same signed session token as the website. The phone stores it and sends `Authorization: Bearer <token>`. Website cookies still work for `/api` too.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Signed in |
| GET/POST | `/api/me/clock`, `/api/me/clock/in`, `/api/me/clock/out` | Employee / owner |
| GET | `/api/me/jobs` | Employee / owner |
| GET/POST | `/api/deliveries/:id`, `/api/deliveries/:id/complete` | Employee / owner |
| GET/POST | `/api/pickups/:id`, `/api/pickups/:id/complete` | Employee / owner |
| GET | `/api/dashboard`, `/api/rentals`, `/api/reports`, `/api/schedule`, `/api/customers`, `/api/employees` | Owner |
| GET | `/api/equipment`, `/api/equipment/:id` | Staff |
| GET | `/api/my/rentals`, `/api/my/rentals/:id` | Customer (own records only) |

Delivery and pickup complete still require at least one photo, condition notes, confirmation, and they still block Available after reported damage.

### Run the phone app

```bash
cd ../rental-mobile
npm start
```

Open in Expo Go, iOS Simulator, or Android emulator. Sign in with the same demo accounts. On a physical phone, set **API server** on the login screen to `http://<your-computer-lan-ip>:3001`.

See `rental-mobile/README.md` for camera permissions and troubleshooting.

---

## Environment variables

Defined in `.env.example`. Do not invent additional secrets; the app only reads these:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma SQLite URL. Default: `file:./dev.db` (file at `prisma/dev.db` because Prisma resolves it relative to the `prisma/` folder). |
| `AUTH_SECRET` | HMAC secret for the `rental_session` cookie. Use a long random string in any shared environment. |

`.env` is gitignored.

---

## Database

Prisma schema: `prisma/schema.prisma`. Provider: SQLite.

```bash
npx prisma generate    # Client
npx prisma db push     # Create/update tables from schema (no separate migration folder)
npm run db:seed        # npx tsx prisma/seed.ts
npm run db:reset       # Destructive: wipe SQLite, push schema, reseed
```

**Do not run `db:reset` against data you care about.** It deletes rentals, photos, and users, then reloads demo data.

Seed creates customers (ABC Construction, XYZ Builders, Summit Siteworks), equipment, open and completed rentals, calendar events, sample documentation images in `public/uploads`, and time punches.

---

## Demo accounts

Password for all seeded accounts: `demo123`

| Role | Email |
| --- | --- |
| Owner | `admin@rental.app` |
| Employee | `employee@rental.app` |
| Employee | `lena@rental.app` |
| Customer (ABC Construction) | `abc@rental.app` |

---

## Testing

```bash
npm test
```

Runs `src/lib/billing.test.ts`:

- Hourly rentals bill at least one hour and round up
- Daily rentals use the equipment rate (not a hardcoded amount)
- Weekly rentals round up partial weeks
- Active rentals return an estimated current charge
- Completed rentals use the stored final amount

---

## Development

```bash
npm run dev          # Next.js dev server with Turbopack (port 3000)
npm run build        # Production build
npm start            # Serve the production build
npm run lint         # ESLint
```

`src/app/**/layout.tsx` sets `dynamic = "force-dynamic"` on authenticated shells so yard data is not statically cached.

---

## UI/UX architecture

The visual language (left rail, header, cards, tables, filters, confirmation dialogs, badges, empty states) was adapted from the **`admin-ui`** project in this workspace. That project is a **reference only**. Ridgeline Rentals does not run `admin-ui` code, does not copy its HR/PTO product, and does not share its database.

The rental app implements its own `AppShell`:

- Permanent left sidebar on desktop
- Sticky header with page title and user menu
- Main content to the right
- Role-specific navigation from `src/lib/nav.ts`

---

## Project references

These folders may sit next to `Rental_App` in the workspace. They are **not** the rental product:

| Folder | Role |
| --- | --- |
| **`Rental_App` / `rental_app`** | The actual Ridgeline Rentals website and JSON APIs. All equipment-rental rules live here. |
| **`rental-mobile`** | Expo / React Native iPhone and Android app. Calls `/api` only; does not contain billing or damage-status logic. |
| **`admin-ui`** | Primary **UI/UX and component-pattern** reference (sidebar, dashboard cards, tables, filters). No rental business logic was taken from it. |
| **`real-estate-prod`** | Secondary **code-architecture** reference only (folder layout, splitting sidebar/header). It is **not** part of Ridgeline Rentals. Do not copy real-estate listings, properties, or agents into this app. |

The business domain of this codebase is **equipment rental management** only.
