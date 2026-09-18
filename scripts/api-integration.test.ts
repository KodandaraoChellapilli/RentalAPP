/**
 * Live API integration checks against the running Rental_App (localhost:3001).
 * Run: npm run test:api
 */
import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.API_BASE || "http://localhost:3001";
const prisma = new PrismaClient();

type LoginResult = {
  token: string;
  user: { id: string; name: string; role: string; email: string; customerId?: string | null };
};

async function login(email: string, password = "demo123"): Promise<LoginResult> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  assert.equal(res.status, 200, `login failed for ${email}: ${JSON.stringify(body)}`);
  assert.ok(body.token);
  assert.ok(body.user?.name);
  return body;
}

async function api(token: string, pathName: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${pathName}`, { ...init, headers });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function tinyPng(): Blob {
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return new Blob([Buffer.from(b64, "base64")], { type: "image/png" });
}

test("health endpoint is up", async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
});

test("invalid login is rejected", async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@rental.app", password: "wrong-password" }),
  });
  assert.equal(res.status, 401);
});

test("admin login returns Sam Carson as owner", async () => {
  const { user } = await login("admin@rental.app");
  assert.equal(user.role, "ADMIN");
  assert.equal(user.name, "Sam Carson");
});

test("employee and customer logins return their own identities", async () => {
  const employee = await login("employee@rental.app");
  assert.equal(employee.user.role, "EMPLOYEE");
  assert.ok(employee.user.name.length > 1);

  const customer = await login("abc@rental.app");
  assert.equal(customer.user.role, "CUSTOMER");
  assert.ok(customer.user.customerId);
  assert.ok(customer.user.name.length > 1);
});

test("only admin can access owner APIs", async () => {
  const employee = await login("employee@rental.app");
  const customer = await login("abc@rental.app");
  const admin = await login("admin@rental.app");

  assert.equal((await api(employee.token, "/api/dashboard")).res.status, 403);
  assert.equal((await api(customer.token, "/api/rentals")).res.status, 403);
  assert.equal((await api(customer.token, "/api/reports")).res.status, 403);
  assert.equal((await api(customer.token, "/api/customers")).res.status, 403);
  assert.equal((await api(employee.token, "/api/employees")).res.status, 403);
  assert.equal((await api(admin.token, "/api/dashboard")).res.status, 200);
  assert.equal((await api(admin.token, "/api/rentals")).res.status, 200);
});

test("customer isolation blocks foreign rental ids", async () => {
  const abc = await login("abc@rental.app");
  const xyz = await login("xyz@rental.app");

  const abcList = await api(abc.token, "/api/my/rentals");
  const xyzList = await api(xyz.token, "/api/my/rentals");
  assert.equal(abcList.res.status, 200);
  assert.equal(xyzList.res.status, 200);

  type RentalRow = { id: string; customer?: { id: string } | null };
  const abcBody = abcList.body as { active: RentalRow[]; history: RentalRow[] };
  const xyzBody = xyzList.body as { active: RentalRow[]; history: RentalRow[] };
  const abcRentals = [...abcBody.active, ...abcBody.history];
  const xyzRentals = [...xyzBody.active, ...xyzBody.history];
  assert.ok(abcRentals.length > 0);
  assert.ok(xyzRentals.length > 0);

  for (const rental of abcRentals) {
    assert.equal(rental.customer?.id, abc.user.customerId);
  }

  const probe = await api(abc.token, `/api/my/rentals/${xyzRentals[0].id}`);
  assert.equal(probe.res.status, 404);
});

test("employee clock in and out", async () => {
  const { token } = await login("employee@rental.app");
  const before = await api(token, "/api/me/clock");
  assert.equal(before.res.status, 200);

  if (!(before.body as { openEntry?: unknown }).openEntry) {
    const inn = await api(token, "/api/me/clock/in", { method: "POST", body: "{}" });
    assert.equal(inn.res.status, 200);
  }

  const mid = await api(token, "/api/me/clock");
  assert.ok((mid.body as { openEntry?: unknown }).openEntry);

  const out = await api(token, "/api/me/clock/out", { method: "POST", body: "{}" });
  assert.equal(out.res.status, 200);

  const after = await api(token, "/api/me/clock");
  assert.equal((after.body as { openEntry: unknown }).openEntry, null);
});

test("workflow: delivery → active → damaged pickup → maintenance + no double pickup", async () => {
  const admin = await login("admin@rental.app");
  const employee = await login("employee@rental.app");
  const lena = await login("lena@rental.app");

  // Prefer AVAILABLE; otherwise temporarily free a non-active machine for the audit run.
  let machine = await prisma.equipment.findFirst({ where: { status: "AVAILABLE" } });
  if (!machine) {
    machine = await prisma.equipment.findFirst({
      where: {
        status: { in: ["MAINTENANCE", "SCHEDULED", "OUT_OF_SERVICE"] },
        rentals: { none: { status: { in: ["ACTIVE", "SCHEDULED"] } } },
      },
    });
    assert.ok(machine, "need a machine that is not currently rented");
    await prisma.equipment.update({ where: { id: machine.id }, data: { status: "AVAILABLE" } });
    machine = await prisma.equipment.findUniqueOrThrow({ where: { id: machine.id } });
  }

  const customer = await prisma.customer.findFirst({ where: { name: { contains: "ABC" } } });
  assert.ok(customer);

  const rental = await prisma.rental.create({
    data: {
      equipmentId: machine.id,
      customerId: customer.id,
      status: "SCHEDULED",
      destination: "910 Audit Lane",
      rateSnapshot: machine.rate,
      billingUnitSnapshot: machine.billingUnit,
      notes: "Audit workflow rental",
    },
  });

  await prisma.equipment.update({
    where: { id: machine.id },
    data: { status: "SCHEDULED" },
  });

  const delivery = await prisma.scheduleEvent.create({
    data: {
      type: "DELIVERY",
      title: `Deliver #${machine.number}`,
      startAt: new Date(),
      equipmentId: machine.id,
      customerId: customer.id,
      employeeId: employee.user.id,
      rentalId: rental.id,
      destination: "910 Audit Lane",
    },
  });

  const jobs = await api(employee.token, "/api/me/jobs");
  assert.equal(jobs.res.status, 200);
  const jobList = (jobs.body as { jobs: Array<{ id: string }> }).jobs;
  assert.ok(jobList.some((j) => j.id === delivery.id), "employee should see website-created job");

  const form = new FormData();
  form.append("equipmentId", machine.id);
  form.append("customerId", customer.id);
  form.append("destination", "910 Audit Lane");
  form.append("notes", "Pre-delivery condition looks good");
  form.append("conditionConfirmed", "true");
  form.append("rentalId", rental.id);
  form.append("photos", tinyPng(), "before.png");

  const delivered = await api(employee.token, `/api/deliveries/${delivery.id}/complete`, {
    method: "POST",
    body: form,
  });
  assert.equal(delivered.res.status, 200, JSON.stringify(delivered.body));

  const activeRental = await prisma.rental.findUnique({ where: { id: rental.id } });
  const activeMachine = await prisma.equipment.findUnique({ where: { id: machine.id } });
  assert.equal(activeRental?.status, "ACTIVE");
  assert.equal(activeMachine?.status, "ON_RENT");
  assert.ok(activeRental?.startAt);

  const deliveryPhotos = await prisma.photo.count({ where: { rentalId: rental.id, type: "DELIVERY" } });
  assert.ok(deliveryPhotos >= 1);

  // Customer sees own rental; Lena (other employee) cannot open pickup for this rental yet without assignment
  const custUser = await prisma.user.findFirst({ where: { customerId: customer.id, role: "CUSTOMER" } });
  assert.ok(custUser);
  const custLogin = await login(custUser.email);
  const mine = await api(custLogin.token, `/api/my/rentals/${rental.id}`);
  assert.equal(mine.res.status, 200);
  assert.equal((mine.body as { rental: { charge: { isEstimate: boolean } } }).rental.charge.isEstimate, true);

  const foreignPickup = await api(lena.token, `/api/pickups/${rental.id}`);
  assert.ok(foreignPickup.res.status === 403 || foreignPickup.res.status === 404);

  const pickup = await prisma.scheduleEvent.create({
    data: {
      type: "PICKUP",
      title: `Pick up #${machine.number}`,
      startAt: new Date(),
      equipmentId: machine.id,
      customerId: customer.id,
      employeeId: employee.user.id,
      rentalId: rental.id,
    },
  });

  const pickupForm = new FormData();
  pickupForm.append("rentalId", rental.id);
  pickupForm.append("notes", "Hydraulic leak found on return");
  pickupForm.append("conditionConfirmed", "true");
  pickupForm.append("hasIssue", "yes");
  pickupForm.append("afterStatus", "MAINTENANCE");
  pickupForm.append("photos", tinyPng(), "after.png");

  const picked = await api(employee.token, `/api/pickups/${pickup.id}/complete`, {
    method: "POST",
    body: pickupForm,
  });
  assert.equal(picked.res.status, 200, JSON.stringify(picked.body));
  assert.equal((picked.body as { afterStatus: string }).afterStatus, "MAINTENANCE");
  assert.ok(typeof (picked.body as { finalAmount: number }).finalAmount === "number");

  const doneRental = await prisma.rental.findUnique({ where: { id: rental.id } });
  const doneMachine = await prisma.equipment.findUnique({ where: { id: machine.id } });
  assert.equal(doneRental?.status, "COMPLETED");
  assert.ok(doneRental?.finalAmount != null);
  assert.equal(doneMachine?.status, "MAINTENANCE");

  const pickupPhotos = await prisma.photo.count({ where: { rentalId: rental.id, type: "PICKUP" } });
  assert.ok(pickupPhotos >= 1);

  const again = await api(employee.token, `/api/pickups/${pickup.id}/complete`, {
    method: "POST",
    body: pickupForm,
  });
  assert.ok(again.res.status >= 400, "double pickup must fail");

  // Missing damage answer must fail
  const available = await prisma.equipment.findFirst({
    where: { status: "AVAILABLE", id: { not: machine.id } },
  });
  if (available) {
    const rental2 = await prisma.rental.create({
      data: {
        equipmentId: available.id,
        customerId: customer.id,
        status: "ACTIVE",
        startAt: new Date(Date.now() - 60 * 60 * 1000),
        destination: "Test",
        rateSnapshot: available.rate,
        billingUnitSnapshot: available.billingUnit,
      },
    });
    await prisma.equipment.update({ where: { id: available.id }, data: { status: "ON_RENT" } });
    const pickup2 = await prisma.scheduleEvent.create({
      data: {
        type: "PICKUP",
        title: `Pick up #${available.number}`,
        startAt: new Date(),
        equipmentId: available.id,
        customerId: customer.id,
        employeeId: employee.user.id,
        rentalId: rental2.id,
      },
    });
    const bad = new FormData();
    bad.append("rentalId", rental2.id);
    bad.append("notes", "forgot damage answer");
    bad.append("conditionConfirmed", "true");
    bad.append("photos", tinyPng(), "after.png");
    const missingIssue = await api(employee.token, `/api/pickups/${pickup2.id}/complete`, {
      method: "POST",
      body: bad,
    });
    assert.ok(missingIssue.res.status >= 400);

    // Cleanup partial rental so seed stays usable
    await prisma.scheduleEvent.delete({ where: { id: pickup2.id } });
    await prisma.rental.delete({ where: { id: rental2.id } });
    await prisma.equipment.update({ where: { id: available.id }, data: { status: "AVAILABLE" } });
  }
});

test("customer pickup request creates a pickup transport without completing the rental", async () => {
  const admin = await login("admin@rental.app");
  const employee = await login("employee@rental.app");
  const abc = await login("abc@rental.app");
  const xyz = await login("xyz@rental.app");

  let machine = await prisma.equipment.findFirst({ where: { status: "AVAILABLE" } });
  if (!machine) {
    machine = await prisma.equipment.findFirst({
      where: {
        status: { in: ["MAINTENANCE", "SCHEDULED", "OUT_OF_SERVICE"] },
        rentals: { none: { status: { in: ["ACTIVE", "SCHEDULED"] } } },
      },
    });
    assert.ok(machine, "need a free machine");
    await prisma.equipment.update({ where: { id: machine.id }, data: { status: "AVAILABLE" } });
    machine = await prisma.equipment.findUniqueOrThrow({ where: { id: machine.id } });
  }

  const customer = await prisma.customer.findFirst({ where: { name: { contains: "ABC" } } });
  assert.ok(customer);

  const rental = await prisma.rental.create({
    data: {
      equipmentId: machine.id,
      customerId: customer.id,
      status: "SCHEDULED",
      destination: "12 Customer Lane",
      rateSnapshot: machine.rate,
      billingUnitSnapshot: machine.billingUnit,
    },
  });
  const delivery = await prisma.scheduleEvent.create({
    data: {
      type: "DELIVERY",
      title: `Deliver #${machine.number}`,
      startAt: new Date(),
      equipmentId: machine.id,
      customerId: customer.id,
      employeeId: employee.user.id,
      rentalId: rental.id,
      destination: "12 Customer Lane",
    },
  });

  const confirmed = await api(abc.token, `/api/my/rentals/${rental.id}/confirm-delivery`, {
    method: "POST",
    body: "{}",
  });
  assert.equal(confirmed.res.status, 200, JSON.stringify(confirmed.body));
  assert.equal((confirmed.body as { status: string }).status, "SCHEDULED");
  const stillScheduled = await prisma.rental.findUnique({ where: { id: rental.id } });
  assert.equal(stillScheduled?.status, "SCHEDULED");

  const svg = new FormData();
  svg.append("equipmentId", machine.id);
  svg.append("customerId", customer.id);
  svg.append("destination", "12 Customer Lane");
  svg.append("notes", "svg should be rejected");
  svg.append("conditionConfirmed", "true");
  svg.append("rentalId", rental.id);
  svg.append("photos", new Blob(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], { type: "image/svg+xml" }), "bad.svg");
  const svgTry = await api(employee.token, `/api/deliveries/${delivery.id}/complete`, { method: "POST", body: svg });
  assert.ok(svgTry.res.status >= 400, "svg uploads must be rejected");
  const afterSvg = await prisma.rental.findUnique({ where: { id: rental.id } });
  assert.equal(afterSvg?.status, "SCHEDULED");

  const form = new FormData();
  form.append("equipmentId", machine.id);
  form.append("customerId", customer.id);
  form.append("destination", "12 Customer Lane");
  form.append("notes", "Ready for customer jobsite");
  form.append("conditionConfirmed", "true");
  form.append("rentalId", rental.id);
  form.append("photos", tinyPng(), "before.png");
  const delivered = await api(employee.token, `/api/deliveries/${delivery.id}/complete`, { method: "POST", body: form });
  assert.equal(delivered.res.status, 200, JSON.stringify(delivered.body));

  const requested = await api(abc.token, `/api/my/rentals/${rental.id}/pickup-request`, {
    method: "POST",
    body: JSON.stringify({
      pickupDate: "2026-09-25",
      pickupTime: "14:30",
      pickupLocation: "12 Customer Lane",
    }),
  });
  assert.equal(requested.res.status, 200, JSON.stringify(requested.body));
  assert.equal((requested.body as { status: string }).status, "ACTIVE");

  const afterRequest = await prisma.rental.findUnique({ where: { id: rental.id } });
  assert.equal(afterRequest?.status, "ACTIVE");
  assert.equal(afterRequest?.destination, "12 Customer Lane");

  const pickupEvent = await prisma.scheduleEvent.findFirst({
    where: { rentalId: rental.id, type: "PICKUP", completedAt: null },
  });
  assert.ok(pickupEvent);
  assert.equal(pickupEvent.source, "CUSTOMER");
  assert.equal(pickupEvent.destination, "12 Customer Lane");

  const foreign = await api(xyz.token, `/api/my/rentals/${rental.id}/pickup-request`, {
    method: "POST",
    body: JSON.stringify({ pickupDate: "2026-09-26", pickupTime: "09:00", pickupLocation: "Other yard" }),
  });
  assert.equal(foreign.res.status, 404);

  const staffDenied = await api(employee.token, `/api/my/rentals/${rental.id}/pickup-request`, {
    method: "POST",
    body: JSON.stringify({ pickupDate: "2026-09-26", pickupTime: "09:00", pickupLocation: "Yard" }),
  });
  assert.equal(staffDenied.res.status, 403);

  const history = await api(admin.token, `/api/equipment/${machine.id}`);
  assert.equal(history.res.status, 200);
  const historyBody = history.body as {
    history: Array<{
      id: string;
      customer?: { name: string };
      deliveredBy?: string | null;
      beforePhotos?: unknown[];
    }>;
  };
  const row = historyBody.history.find((item) => item.id === rental.id);
  assert.ok(row);
  assert.equal(row.customer?.name.includes("ABC"), true);
  assert.equal(row.deliveredBy, employee.user.name);
  assert.ok((row.beforePhotos || []).length >= 1);

  const transports = await api(admin.token, "/api/transports");
  assert.equal(transports.res.status, 200);
  assert.equal((await api(employee.token, "/api/transports")).res.status, 403);
  assert.equal((await api(abc.token, "/api/transports")).res.status, 403);
  assert.equal((await api(abc.token, "/api/dashboard")).res.status, 403);
});

test.after(async () => {
  await prisma.$disconnect();
});
