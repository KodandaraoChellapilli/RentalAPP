import { mkdir, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function svgPhoto(label: string, subtitle: string, color: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <rect x="80" y="120" width="1040" height="560" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)"/>
  <text x="600" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="#fff" font-weight="700">${label}</text>
  <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#fde68a">${subtitle}</text>
  <text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#e7e5e4">Condition documentation photo</text>
</svg>`;
}

async function saveSvg(filename: string, contents: string) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), contents);
  return `/uploads/${filename}`;
}

async function main() {
  await prisma.photo.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.user.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.customer.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 10);

  const abc = await prisma.customer.create({
    data: {
      name: "ABC Construction",
      email: "jobs@abcconstruction.example",
      phone: "(555) 201-4400",
      address: "1840 Industrial Pkwy, Denver, CO",
      notes: "Preferred customer. Jobsite contact: Dana.",
    },
  });

  const xyz = await prisma.customer.create({
    data: {
      name: "XYZ Builders",
      email: "ops@xyzbuilders.example",
      phone: "(555) 883-1190",
      address: "92 Ridge Road, Aurora, CO",
    },
  });

  const summit = await prisma.customer.create({
    data: {
      name: "Summit Siteworks",
      email: "office@summitsiteworks.example",
      phone: "(555) 441-2208",
      address: "410 Copper Ave, Boulder, CO",
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@rental.app",
      passwordHash,
      name: "Alex Morgan",
      role: "ADMIN",
      phone: "(555) 100-0001",
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: "employee@rental.app",
      passwordHash,
      name: "Marcus Hale",
      role: "EMPLOYEE",
      phone: "(555) 100-0002",
    },
  });

  const lena = await prisma.user.create({
    data: {
      email: "lena@rental.app",
      passwordHash,
      name: "Lena Ortiz",
      role: "EMPLOYEE",
      phone: "(555) 100-0003",
    },
  });

  await prisma.user.create({
    data: {
      email: "abc@rental.app",
      passwordHash,
      name: "Dana Chen",
      role: "CUSTOMER",
      phone: "(555) 201-4400",
      customerId: abc.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "xyz@rental.app",
      passwordHash,
      name: "Jordan Blake",
      role: "CUSTOMER",
      phone: "(555) 883-1190",
      customerId: xyz.id,
    },
  });

  const miniEx = await prisma.equipment.create({
    data: {
      number: "306",
      name: "Mini Excavator",
      type: "Excavator",
      status: "ON_RENT",
      rate: 300,
      billingUnit: "DAILY",
      notes: "Thumb attachment included.",
    },
  });

  const skid = await prisma.equipment.create({
    data: {
      number: "412",
      name: "Skid Steer",
      type: "Loader",
      status: "PICKUP_SCHEDULED",
      rate: 400,
      billingUnit: "DAILY",
    },
  });

  const miniX = await prisma.equipment.create({
    data: {
      number: "218",
      name: "Mini X",
      type: "Excavator",
      status: "SCHEDULED",
      rate: 350,
      billingUnit: "DAILY",
    },
  });

  const tele = await prisma.equipment.create({
    data: {
      number: "501",
      name: "Telehandler",
      type: "Lift",
      status: "MAINTENANCE",
      rate: 475,
      billingUnit: "DAILY",
      notes: "Hydraulic leak being repaired.",
    },
  });

  const trailer = await prisma.equipment.create({
    data: {
      number: "105",
      name: "Dump Trailer",
      type: "Trailer",
      status: "AVAILABLE",
      rate: 85,
      billingUnit: "HOURLY",
    },
  });

  const roller = await prisma.equipment.create({
    data: {
      number: "640",
      name: "Vibratory Roller",
      type: "Compactor",
      status: "AVAILABLE",
      rate: 1200,
      billingUnit: "WEEKLY",
    },
  });

  const rental306 = await prisma.rental.create({
    data: {
      equipmentId: miniEx.id,
      customerId: abc.id,
      status: "ACTIVE",
      destination: "ABC jobsite — 1840 Industrial Pkwy",
      startAt: hoursAgo(52),
      expectedPickupAt: hoursFromNow(48),
      rateSnapshot: 300,
      billingUnitSnapshot: "DAILY",
    },
  });

  const rental412 = await prisma.rental.create({
    data: {
      equipmentId: skid.id,
      customerId: xyz.id,
      status: "ACTIVE",
      destination: "XYZ Builders — 92 Ridge Road",
      startAt: hoursAgo(78),
      expectedPickupAt: hoursFromNow(6),
      rateSnapshot: 400,
      billingUnitSnapshot: "DAILY",
    },
  });

  const past218 = await prisma.rental.create({
    data: {
      equipmentId: miniX.id,
      customerId: abc.id,
      status: "COMPLETED",
      destination: "ABC jobsite — 1840 Industrial Pkwy",
      startAt: hoursAgo(24 * 10),
      endAt: hoursAgo(24 * 7),
      rateSnapshot: 350,
      billingUnitSnapshot: "DAILY",
      finalAmount: 1050,
    },
  });

  const scheduled218 = await prisma.rental.create({
    data: {
      equipmentId: miniX.id,
      customerId: summit.id,
      status: "SCHEDULED",
      destination: "Summit Siteworks — 410 Copper Ave",
      expectedPickupAt: hoursFromNow(24 * 5),
      rateSnapshot: 350,
      billingUnitSnapshot: "DAILY",
    },
  });

  await prisma.scheduleEvent.createMany({
    data: [
      {
        type: "DELIVERY",
        title: "Deliver #306",
        startAt: hoursAgo(52),
        completedAt: hoursAgo(52),
        equipmentId: miniEx.id,
        customerId: abc.id,
        employeeId: marcus.id,
        rentalId: rental306.id,
        destination: rental306.destination,
      },
      {
        type: "DELIVERY",
        title: "Deliver #412",
        startAt: hoursAgo(78),
        completedAt: hoursAgo(78),
        equipmentId: skid.id,
        customerId: xyz.id,
        employeeId: lena.id,
        rentalId: rental412.id,
        destination: rental412.destination,
      },
      {
        type: "PICKUP",
        title: "Pick up #412",
        startAt: hoursFromNow(6),
        equipmentId: skid.id,
        customerId: xyz.id,
        employeeId: marcus.id,
        rentalId: rental412.id,
        destination: rental412.destination,
      },
      {
        type: "DELIVERY",
        title: "Deliver #218",
        startAt: hoursFromNow(18),
        equipmentId: miniX.id,
        customerId: summit.id,
        employeeId: lena.id,
        rentalId: scheduled218.id,
        destination: scheduled218.destination,
      },
      {
        type: "DELIVERY",
        title: "Deliver #218",
        startAt: hoursAgo(24 * 10),
        completedAt: hoursAgo(24 * 10),
        equipmentId: miniX.id,
        customerId: abc.id,
        employeeId: marcus.id,
        rentalId: past218.id,
        destination: past218.destination,
      },
      {
        type: "PICKUP",
        title: "Pick up #218",
        startAt: hoursAgo(24 * 7),
        completedAt: hoursAgo(24 * 7),
        equipmentId: miniX.id,
        customerId: abc.id,
        employeeId: lena.id,
        rentalId: past218.id,
        destination: past218.destination,
      },
    ],
  });

  const photo306d = await saveSvg(
    "306-delivery.svg",
    svgPhoto("Equipment #306", "Delivery / Before", "#b45309"),
  );
  const photo412d = await saveSvg(
    "412-delivery.svg",
    svgPhoto("Equipment #412", "Delivery / Before", "#1d4ed8"),
  );
  const photo218d = await saveSvg(
    "218-delivery.svg",
    svgPhoto("Equipment #218", "Delivery / Before", "#047857"),
  );
  const photo218p = await saveSvg(
    "218-pickup.svg",
    svgPhoto("Equipment #218", "Pickup / After", "#0f766e"),
  );

  await prisma.photo.createMany({
    data: [
      {
        equipmentId: miniEx.id,
        rentalId: rental306.id,
        uploadedById: marcus.id,
        type: "DELIVERY",
        path: photo306d,
        takenAt: hoursAgo(52),
        notes: "Hours recorded, no visible damage, full fuel.",
      },
      {
        equipmentId: skid.id,
        rentalId: rental412.id,
        uploadedById: lena.id,
        type: "DELIVERY",
        path: photo412d,
        takenAt: hoursAgo(78),
        notes: "Tracks clean, no leaks, 3/4 tank.",
      },
      {
        equipmentId: miniX.id,
        rentalId: past218.id,
        uploadedById: marcus.id,
        type: "DELIVERY",
        path: photo218d,
        takenAt: hoursAgo(24 * 10),
        notes: "Bucket, pins, and glass inspected before delivery.",
      },
      {
        equipmentId: miniX.id,
        rentalId: past218.id,
        uploadedById: lena.id,
        type: "PICKUP",
        path: photo218p,
        takenAt: hoursAgo(24 * 7),
        notes: "Returned clean. No new damage observed.",
      },
    ],
  });

  const seededPhotos = await prisma.photo.findMany();
  for (const photo of seededPhotos) {
    const event = await prisma.scheduleEvent.findFirst({
      where: { rentalId: photo.rentalId, type: photo.type },
      orderBy: { startAt: "asc" },
    });
    if (!event) continue;
    await prisma.photo.update({
      where: { id: photo.id },
      data: { eventId: event.id },
    });
  }

  await prisma.timeEntry.createMany({
    data: [
      {
        employeeId: marcus.id,
        clockIn: hoursAgo(9),
        clockOut: hoursAgo(1),
      },
      {
        employeeId: lena.id,
        clockIn: hoursAgo(8.5),
        clockOut: hoursAgo(0.5),
      },
      {
        employeeId: marcus.id,
        clockIn: hoursAgo(33),
        clockOut: hoursAgo(24),
      },
    ],
  });

  void admin;
  void trailer;
  void tele;
  void roller;

  console.log("Seeded demo data.");
  console.log("Admin:     admin@rental.app / demo123");
  console.log("Employee:  employee@rental.app / demo123");
  console.log("Customer:  abc@rental.app / demo123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
