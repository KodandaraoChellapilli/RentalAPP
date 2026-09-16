import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { deflateSync } from "zlib";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function crc32(buf: Buffer) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crc]);
}

/** Solid RN-friendly demo PNGs (SVG is not supported by React Native Image). */
function demoPng(
  paint: (x: number, y: number, w: number, h: number) => [number, number, number],
  w = 640,
  h = 400,
) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y, w, h);
      const i = y * (w * 3 + 1) + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const DEMO_SCENES: Record<string, (x: number, y: number, w: number, h: number) => [number, number, number]> = {
  "306-delivery.png": (x, y, w, h) => {
    if (y < h * 0.42) return [120 + Math.floor((x / w) * 40), 170, 210];
    if (y > h * 0.78) return [110, 90, 60];
    const cx = w * 0.45;
    const cy = h * 0.55;
    if (Math.abs(x - cx) < w * 0.18 && Math.abs(y - cy) < h * 0.16) return [230, 170, 40];
    if (x > cx && x < cx + w * 0.28 && y > cy - h * 0.08 && y < cy) return [200, 140, 30];
    return [150, 145, 130];
  },
  "306-pickup.png": (x, y, w, h) => {
    if (y < h * 0.4) return [90, 130, 170];
    if (y > h * 0.8) return [90, 80, 55];
    const cx = w * 0.5;
    const cy = h * 0.58;
    if (Math.abs(x - cx) < w * 0.2 && Math.abs(y - cy) < h * 0.18) return [235, 180, 45];
    return [140, 138, 125];
  },
  "218-delivery.png": (x, y, w, h) => {
    if (y < h * 0.45) return [160, 190, 220];
    if (y > h * 0.75) return [100, 95, 80];
    if (x > w * 0.25 && x < w * 0.75 && y > h * 0.4 && y < h * 0.7) return [50, 110, 180];
    return [130, 125, 110];
  },
  "218-pickup.png": (x, y, w, h) => {
    if (y < h * 0.4) return [140, 170, 200];
    if (y > h * 0.78) return [95, 85, 65];
    if (x > w * 0.2 && x < w * 0.8 && y > h * 0.38 && y < h * 0.72) return [40, 95, 160];
    return [125, 120, 105];
  },
  "412-delivery.png": (x, y, w, h) => {
    if (y < h * 0.38) return [180, 200, 220];
    if (y > h * 0.8) return [85, 80, 70];
    if (x > w * 0.3 && x < w * 0.7 && y > h * 0.35 && y < h * 0.75) return [200, 55, 40];
    return [145, 140, 130];
  },
};

async function saveDemoPhoto(filename: keyof typeof DEMO_SCENES) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), demoPng(DEMO_SCENES[filename]));
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
      name: "Sam Carson",
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

  const photo306d = await saveDemoPhoto("306-delivery.png");
  const photo412d = await saveDemoPhoto("412-delivery.png");
  const photo218d = await saveDemoPhoto("218-delivery.png");
  const photo218p = await saveDemoPhoto("218-pickup.png");
  await saveDemoPhoto("306-pickup.png");

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
