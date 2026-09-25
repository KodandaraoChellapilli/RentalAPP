/**
 * Production-readiness checks against the running app (localhost:3001).
 * Run with the existing API suite: npm run test:api
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
  assert.equal(res.status, 200, JSON.stringify(body));
  return body;
}

async function api(token: string | null, pathName: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
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
  return { res, body, text };
}

function tinyPng() {
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return new Blob([Buffer.from(b64, "base64")], { type: "image/png" });
}

test("authentication rejects bad credentials and does not return secrets", async () => {
  const missing = await api(null, "/api/auth/login", { method: "POST", body: JSON.stringify({}) });
  assert.equal(missing.res.status, 400);
  assert.equal((missing.body as { error: string }).error, "Email and password are required.");

  const badEmail = await api(null, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "nobody@example.com", password: "not-the-password" }),
  });
  const badPassword = await api(null, "/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@rental.app", password: "not-the-password" }),
  });
  assert.equal(badEmail.res.status, 401);
  assert.equal(badPassword.res.status, 401);
  assert.equal((badEmail.body as { error: string }).error, (badPassword.body as { error: string }).error);
  assert.equal(badPassword.text.includes("not-the-password"), false);
  assert.equal(badPassword.text.toLowerCase().includes("hash"), false);

  const admin = await login("admin@rental.app");
  assert.equal("password" in admin.user, false);
  assert.equal("passwordHash" in admin.user, false);

  const loggedOut = await api(null, "/api/auth/logout", { method: "POST" });
  assert.equal(loggedOut.res.status, 200);
  const expired = await api("not-a-real-session", "/api/auth/me");
  assert.equal(expired.res.status, 401);

  const page = await fetch(`${BASE}/admin/dashboard`, { redirect: "manual" });
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location") || "", /\/login/);
  assert.equal((await api(null, "/api/invoices")).res.status, 401);
  assert.equal((await api(null, "/api/customers")).res.status, 401);
});

test("cors reflects an allowed origin and hides unapproved origins", async () => {
  const allowed = await fetch(`${BASE}/api/health`, { headers: { Origin: "http://localhost:3001" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3001");

  const blocked = await fetch(`${BASE}/api/health`, { headers: { Origin: "https://unapproved.example" } });
  assert.equal(blocked.headers.get("access-control-allow-origin"), null);

  const missing = await fetch(`${BASE}/api/health`);
  assert.equal(missing.headers.get("access-control-allow-origin"), null);
});

test("public equipment catalog is read-only and omits private fields", async () => {
  const res = await fetch(`${BASE}/api/public/equipment`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { equipment: Array<Record<string, unknown>> };
  assert.ok(body.equipment.length > 0);
  for (const item of body.equipment) {
    for (const key of ["customer", "customers", "invoice", "invoices", "notes", "description", "employee", "documents", "damage"]) {
      assert.equal(key in item, false, key);
    }
    if (typeof item.photoUrl === "string") assert.match(item.photoUrl, /[?&]sig=/);
  }
  assert.equal((await fetch(`${BASE}/api/public/equipment`, { method: "POST" })).status, 405);
  assert.equal((await fetch(`${BASE}/api/public/equipment`, { method: "PUT" })).status, 405);
  assert.equal((await fetch(`${BASE}/api/public/equipment`, { method: "DELETE" })).status, 405);
});

test("roles stay inside their own routes", async () => {
  const admin = await login("admin@rental.app");
  const employee = await login("employee@rental.app");
  const customer = await login("abc@rental.app");
  const owner = await prisma.user.findUnique({ where: { email: "admin@rental.app" } });
  assert.ok(owner);
  const email = `manager-audit-${Date.now()}@rental.app`;
  const managerUser = await prisma.user.create({
    data: { email, name: "Yard Manager", role: "MANAGER", passwordHash: owner.passwordHash },
  });
  try {
    const manager = await login(email);
    for (const pathName of ["/api/dashboard", "/api/rentals", "/api/equipment", "/api/transports", "/api/customers", "/api/invoices"]) {
      assert.equal((await api(admin.token, pathName)).res.status, 200, pathName);
      assert.equal((await api(manager.token, pathName)).res.status, 200, pathName);
    }
    assert.equal((await api(manager.token, "/api/employees")).res.status, 403);
    assert.equal((await api(manager.token, "/api/reports")).res.status, 403);
    assert.equal((await api(employee.token, "/api/invoices")).res.status, 403);
    assert.equal((await api(employee.token, "/api/customers")).res.status, 403);
    assert.equal((await api(customer.token, "/api/invoices")).res.status, 403);
    assert.equal((await api(customer.token, "/api/customers")).res.status, 403);
    assert.equal((await api(customer.token, "/api/equipment")).res.status, 403);
    assert.equal((await api(customer.token, "/api/dashboard")).res.status, 403);
  } finally {
    await prisma.user.delete({ where: { id: managerUser.id } });
  }
});

test("customer isolation, invoice totals, coi, and the yard workflow", async () => {
  const admin = await login("admin@rental.app");
  const employee = await login("employee@rental.app");
  const owner = await prisma.user.findUnique({ where: { email: "admin@rental.app" } });
  assert.ok(owner);
  const stamp = Date.now();
  const customerA = await prisma.customer.create({
    data: { name: `Audit A ${stamp}`, email: `a-${stamp}@example.com`, phone: "555-0101", address: "1 Audit Road" },
  });
  const customerB = await prisma.customer.create({
    data: { name: `Audit B ${stamp}`, email: `b-${stamp}@example.com`, phone: "555-0102", address: "2 Audit Road" },
  });
  const userA = await prisma.user.create({
    data: { email: `login-a-${stamp}@rental.app`, name: "Audit A", role: "CUSTOMER", customerId: customerA.id, passwordHash: owner.passwordHash },
  });
  const userB = await prisma.user.create({
    data: { email: `login-b-${stamp}@rental.app`, name: "Audit B", role: "CUSTOMER", customerId: customerB.id, passwordHash: owner.passwordHash },
  });
  const machine = await prisma.equipment.create({
    data: { number: `Z${String(stamp).slice(-8)}`, name: "Audit Excavator", type: "Excavator", status: "AVAILABLE", rate: 200, billingUnit: "DAILY", notes: "Internal yard note" },
  });
  let rentalId = "";
  try {
    const loginA = await login(userA.email);
    const loginB = await login(userB.email);
    const rental = await prisma.rental.create({
      data: {
        equipmentId: machine.id,
        customerId: customerA.id,
        status: "SCHEDULED",
        destination: "1 Audit Road",
        rateSnapshot: 200,
        billingUnitSnapshot: "DAILY",
        notes: "Condition looks ready",
      },
    });
    rentalId = rental.id;
    await prisma.equipment.update({ where: { id: machine.id }, data: { status: "SCHEDULED" } });
    const delivery = await prisma.scheduleEvent.create({
      data: {
        type: "DELIVERY",
        title: `Deliver #${machine.number}`,
        startAt: new Date(),
        equipmentId: machine.id,
        customerId: customerA.id,
        employeeId: employee.user.id,
        rentalId: rental.id,
        destination: "1 Audit Road",
      },
    });

    const confirmed = await api(loginA.token, `/api/my/rentals/${rental.id}/confirm-delivery`, { method: "POST" });
    assert.equal(confirmed.res.status, 200, confirmed.text);
    assert.equal((await prisma.rental.findUnique({ where: { id: rental.id } }))?.status, "SCHEDULED");
    assert.equal((await api(loginB.token, `/api/my/rentals/${rental.id}/confirm-delivery`, { method: "POST" })).res.status, 404);

    const form = new FormData();
    form.append("equipmentId", machine.id);
    form.append("customerId", customerA.id);
    form.append("destination", "1 Audit Road");
    form.append("notes", "Before delivery: no damage");
    form.append("conditionConfirmed", "true");
    form.append("rentalId", rental.id);
    form.append("photos", tinyPng(), "before.png");
    const delivered = await api(employee.token, `/api/deliveries/${delivery.id}/complete`, { method: "POST", body: form });
    assert.equal(delivered.res.status, 200, delivered.text);
    assert.equal((await prisma.rental.findUnique({ where: { id: rental.id } }))?.status, "ACTIVE");
    assert.equal((await prisma.equipment.findUnique({ where: { id: machine.id } }))?.status, "ON_RENT");

    const end = await api(loginA.token, `/api/my/rentals/${rental.id}/pickup-request`, {
      method: "POST",
      body: JSON.stringify({ pickupDate: "2026-10-02", pickupTime: "09:30", pickupLocation: "1 Audit Road" }),
    });
    assert.equal(end.res.status, 200, end.text);
    assert.equal((await prisma.rental.findUnique({ where: { id: rental.id } }))?.status, "ACTIVE");
    assert.equal((await api(loginA.token, `/api/pickups/${rental.id}/complete`, { method: "POST", body: new FormData() })).res.status, 403);

    const pickup = await prisma.scheduleEvent.findFirst({ where: { rentalId: rental.id, type: "PICKUP", completedAt: null } });
    assert.ok(pickup);
    await prisma.scheduleEvent.update({ where: { id: pickup.id }, data: { employeeId: employee.user.id } });
    const pickupForm = new FormData();
    pickupForm.append("rentalId", rental.id);
    pickupForm.append("notes", "Hydraulic leak on return");
    pickupForm.append("conditionConfirmed", "true");
    pickupForm.append("hasIssue", "yes");
    pickupForm.append("afterStatus", "MAINTENANCE");
    pickupForm.append("photos", tinyPng(), "after.png");
    const picked = await api(employee.token, `/api/pickups/${pickup.id}/complete`, { method: "POST", body: pickupForm });
    assert.equal(picked.res.status, 200, picked.text);
    const finished = await prisma.rental.findUnique({ where: { id: rental.id } });
    assert.equal(finished?.status, "COMPLETED");
    assert.equal(typeof finished?.finalAmount, "number");
    assert.ok((finished?.finalAmount || 0) > 0);
    assert.equal((await prisma.equipment.findUnique({ where: { id: machine.id } }))?.status, "MAINTENANCE");

    const created = await api(admin.token, "/api/invoices", {
      method: "POST",
      body: JSON.stringify({ rentalId: rental.id, total: 1, subtotal: 0, finalAmount: -50 }),
    });
    assert.equal(created.res.status, 201, created.text);
    const invoice = (created.body as { invoice: { id: string; number: string; total: number; status: string; customer: { id: string }; rental: { id: string } } }).invoice;
    assert.match(invoice.number, /^INV-/);
    assert.equal(invoice.total, finished?.finalAmount);
    assert.notEqual(invoice.total, 1);
    assert.equal(invoice.status, "UNPAID");
    assert.equal(invoice.customer.id, customerA.id);
    assert.equal(invoice.rental.id, rental.id);
    assert.equal((await api(admin.token, "/api/invoices", { method: "POST", body: JSON.stringify({ rentalId: rental.id }) })).res.status, 409);
    assert.equal((await api(loginA.token, "/api/invoices", { method: "POST", body: JSON.stringify({ rentalId: rental.id }) })).res.status, 403);
    assert.equal((await api(employee.token, "/api/invoices", { method: "POST", body: JSON.stringify({ rentalId: rental.id }) })).res.status, 403);
    assert.equal((await api(loginA.token, `/api/invoices/${invoice.id}`)).res.status, 403);
    assert.equal((await api(loginA.token, `/api/invoices/${invoice.id}`, { method: "PATCH", body: JSON.stringify({ status: "PAID" }) })).res.status, 403);
    assert.equal((await api(loginB.token, `/api/invoices/${invoice.id}`)).res.status, 403);

    const mine = await api(loginA.token, `/api/my/invoices?customerId=${customerB.id}`);
    const mineIds = ((mine.body as { invoices: Array<{ id: string }> }).invoices || []).map((item) => item.id);
    assert.equal(mineIds.includes(invoice.id), true);
    const theirs = await api(loginB.token, "/api/my/invoices");
    const theirIds = ((theirs.body as { invoices: Array<{ id: string }> }).invoices || []).map((item) => item.id);
    assert.equal(theirIds.includes(invoice.id), false);
    assert.equal((await api(loginB.token, `/api/my/rentals/${rental.id}`)).res.status, 404);

    const paid = await api(admin.token, `/api/invoices/${invoice.id}`, { method: "PATCH", body: JSON.stringify({ status: "PAID" }) });
    assert.equal(paid.res.status, 200);
    const unpaid = await prisma.invoice.findMany({ where: { status: "UNPAID" }, select: { total: true } });
    const dashboard = await api(admin.token, "/api/dashboard");
    const metrics = (dashboard.body as { invoices: { total: number; paid: number; unpaid: number; outstanding: number } }).invoices;
    assert.equal(metrics.total, await prisma.invoice.count());
    assert.equal(metrics.paid, await prisma.invoice.count({ where: { status: "PAID" } }));
    assert.equal(metrics.unpaid, unpaid.length);
    assert.equal(metrics.outstanding, unpaid.reduce((sum, item) => sum + item.total, 0));

    const history = await api(admin.token, `/api/equipment/${machine.id}`);
    const row = (history.body as { history: Array<{ id: string; customer?: { name: string }; deliveredBy?: string; pickedUpBy?: string; beforePhotos?: Array<{ url: string }>; afterPhotos?: Array<{ url: string }>; invoice?: { id: string } }> }).history.find((item) => item.id === rental.id);
    assert.ok(row);
    assert.equal(row.customer?.name, customerA.name);
    assert.equal(row.deliveredBy, employee.user.name);
    assert.ok(row.pickedUpBy);
    assert.ok((row.beforePhotos || []).length >= 1);
    assert.ok((row.afterPhotos || []).length >= 1);
    const photoUrl = row.beforePhotos?.[0]?.url || "";
    assert.match(photoUrl, /[?&]sig=/);
    assert.equal((await fetch(photoUrl)).status, 200);
    assert.equal((await fetch(`${BASE}${new URL(photoUrl).pathname}`)).status, 404);
    assert.equal((await fetch(`${BASE}/uploads/../.env`)).status, 404);
    assert.equal((await api(loginB.token, `/api/equipment/${machine.id}`)).res.status, 403);

    const catalog = await fetch(`${BASE}/api/public/equipment`);
    const catalogBody = (await catalog.json()) as { equipment: Array<{ id: string; notes?: string; photoUrl?: string | null }> };
    const listed = catalogBody.equipment.find((item) => item.id === machine.id);
    assert.ok(listed);
    assert.equal(listed.notes, undefined);
    assert.equal(listed.photoUrl, null);

    const pdf = new FormData();
    pdf.set("name", "Audit COI");
    pdf.set("file", new File([Buffer.from("%PDF-1.4 audit")], "coi.pdf", { type: "application/pdf" }));
    const uploaded = await fetch(`${BASE}/api/customers/${customerA.id}/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin.token}` },
      body: pdf,
    });
    const uploadedText = await uploaded.text();
    assert.equal(uploaded.status, 201, uploadedText);
    const documentId = (JSON.parse(uploadedText) as { document: { id: string } }).document.id;
    for (const [name, type, bytes] of [
      ["photo.jpg", "image/jpeg", Buffer.from("jpeg")],
      ["photo.png", "image/png", Buffer.from("png")],
      ["notes.txt", "text/plain", Buffer.from("text")],
      ["bundle.zip", "application/zip", Buffer.from("zip")],
      ["page.html", "text/html", Buffer.from("<html>")],
      ["run.exe", "application/octet-stream", Buffer.from("MZ")],
      ["fake.pdf", "application/pdf", Buffer.from("<html>")],
    ] as const) {
      const bad = new FormData();
      bad.set("file", new File([bytes], name, { type }));
      const rejected = await fetch(`${BASE}/api/customers/${customerA.id}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${admin.token}` },
        body: bad,
      });
      assert.equal(rejected.status, 400, name);
    }
    assert.equal((await api(loginA.token, `/api/documents/${documentId}`)).res.status, 200);
    assert.equal((await api(loginB.token, `/api/documents/${documentId}`)).res.status, 403);
    assert.equal((await api(null, `/api/documents/${documentId}`)).res.status, 401);
    assert.equal((await fetch(`${BASE}/storage/private/customers/${customerA.id}/${documentId}.pdf`)).status, 404);
    assert.equal((await api(loginA.token, "/api/documents/..%2F..%2F.env")).res.status, 404);
  } finally {
    if (rentalId) {
      await prisma.customerDocument.deleteMany({ where: { customerId: { in: [customerA.id, customerB.id] } } });
      await prisma.photo.deleteMany({ where: { rentalId } });
      await prisma.scheduleEvent.deleteMany({ where: { rentalId } });
      await prisma.invoice.deleteMany({ where: { rentalId } });
      await prisma.rental.deleteMany({ where: { id: rentalId } });
    }
    await prisma.equipment.deleteMany({ where: { id: machine.id } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await prisma.customer.deleteMany({ where: { id: { in: [customerA.id, customerB.id] } } });
  }
});

test.after(async () => {
  await prisma.$disconnect();
});
