/**
 * SafeRide seed script — realistic (clearly-labelled demo) sample data.
 *
 * Run with:  npx prisma db seed
 *
 * All accounts share the demo password below. These are SAMPLE accounts and
 * must never be used in production.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Password123!";

function at(hours: number, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function reset() {
  const tables = [
    "notificationDeliveryLog",
    "notification",
    "notificationPreference",
    "boardingEvent",
    "dropoffEvent",
    "gpsLocationUpdate",
    "studentTripAssignment",
    "tripAssignment",
    "safetyIncident",
    "trip",
    "routeStop",
    "route",
    "refund",
    "payment",
    "invoice",
    "subscription",
    "promoCode",
    "guardianRelationship",
    "schoolEnrollment",
    "authorizedPickupPerson",
    "emergencyContact",
    "student",
    "address",
    "vehicle",
    "driver",
    "bus",
    "schoolStaff",
    "school",
    "ticketMessage",
    "supportTicket",
    "otpToken",
    "passwordResetToken",
    "auditLog",
    "parentProfile",
    "user",
    "role",
    "subscriptionPlan",
  ] as const;
  for (const t of tables) {
    // @ts-expect-error dynamic delegate access
    await prisma[t].deleteMany();
  }
}

async function main() {
  console.log("Resetting demo data...");
  await reset();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Roles ---------------------------------------------------------------
  const roles = [
    { key: "PARENT", name: "Parent / Guardian", permissions: ["children:manage", "subscription:manage", "tracking:view", "support:create"] },
    { key: "DRIVER", name: "School Bus Driver", permissions: ["trips:execute", "students:board", "incidents:report", "gps:send"] },
    { key: "SCHOOL_ADMIN", name: "School Administrator", permissions: ["school:manage", "students:view", "routes:view", "reports:export"] },
    { key: "SUPER_ADMIN", name: "Super Administrator", permissions: ["*"] },
    { key: "SUPPORT", name: "Customer Support", permissions: ["tickets:manage", "parents:view", "refunds:review"] },
  ];
  await prisma.role.createMany({
    data: roles.map((r) => ({ ...r, permissions: JSON.stringify(r.permissions) })),
  });

  // --- Subscription plans --------------------------------------------------
  const planRoundMonthly = await prisma.subscriptionPlan.create({
    data: { name: "Monthly Round Trip", planType: "MONTHLY", serviceType: "ROUND_TRIP", basePrice: 1500, perKmPrice: 12, siblingDiscountPercent: 10, description: "Home-to-school and back, every school day." },
  });
  const planOneWayMonthly = await prisma.subscriptionPlan.create({
    data: { name: "Monthly One Way", planType: "MONTHLY", serviceType: "ONE_WAY", basePrice: 950, perKmPrice: 8, siblingDiscountPercent: 10, description: "Morning only or afternoon only." },
  });
  await prisma.subscriptionPlan.create({
    data: { name: "Term Round Trip", planType: "TERM", serviceType: "ROUND_TRIP", basePrice: 4200, perKmPrice: 30, siblingDiscountPercent: 12, description: "Full academic term (3 months)." },
  });
  await prisma.subscriptionPlan.create({
    data: { name: "Annual Round Trip", planType: "ANNUAL", serviceType: "ROUND_TRIP", basePrice: 15000, perKmPrice: 100, siblingDiscountPercent: 15, description: "Full academic year." },
  });

  await prisma.promoCode.create({
    data: { code: "WELCOME10", discountPercent: 10, maxUses: 500, isActive: true, activeFrom: daysAgo(30), activeTo: daysAhead(120) },
  });

  // --- Schools -------------------------------------------------------------
  const schoolA = await prisma.school.create({
    data: { name: "Nile International School", code: "NIS", addressText: "12 Abbas El Akkad, Nasr City", area: "Nasr City", city: "Cairo", lat: 30.0596, lng: 31.3416, phone: "+20 2 2401 0000", email: "transport@nis.demo", arrivalWindowFrom: "07:15", arrivalWindowTo: "07:45", dismissTime: "14:30" },
  });
  const schoolB = await prisma.school.create({
    data: { name: "Pyramids Language School", code: "PLS", addressText: "5 El Tahrir St, Dokki", area: "Dokki", city: "Giza", lat: 30.0384, lng: 31.2127, phone: "+20 2 3336 0000", email: "transport@pls.demo", arrivalWindowFrom: "07:00", arrivalWindowTo: "07:30", dismissTime: "14:00" },
  });

  // --- Buses & vehicles ----------------------------------------------------
  const bus1 = await prisma.bus.create({
    data: { code: "BUS-101", plateNumber: "CAI-4821", make: "Toyota", model: "Coaster", year: 2022, capacity: 14, status: "ACTIVE", gpsDeviceId: "GPS-101", inspectionExpiry: daysAhead(120), insuranceExpiry: daysAhead(200),
      vehicles: { create: { make: "Toyota", model: "Coaster", year: 2022, plateNumber: "CAI-4821", inspectionExpiry: daysAhead(120), insuranceExpiry: daysAhead(200) } } },
  });
  const bus2 = await prisma.bus.create({
    data: { code: "BUS-202", plateNumber: "GIZ-7703", make: "Mercedes", model: "Sprinter", year: 2021, capacity: 20, status: "ACTIVE", gpsDeviceId: "GPS-202", inspectionExpiry: daysAhead(60), insuranceExpiry: daysAhead(150),
      vehicles: { create: { make: "Mercedes", model: "Sprinter", year: 2021, plateNumber: "GIZ-7703" } } },
  });
  const bus3 = await prisma.bus.create({
    data: { code: "BUS-303", plateNumber: "CAI-1155", make: "Hyundai", model: "County", year: 2020, capacity: 30, status: "MAINTENANCE", gpsDeviceId: "GPS-303",
      vehicles: { create: { make: "Hyundai", model: "County", year: 2020, plateNumber: "CAI-1155" } } },
  });

  // --- Users ---------------------------------------------------------------
  const superAdmin = await prisma.user.create({ data: { email: "admin@saferide.demo", phone: "+201000000001", passwordHash, role: "SUPER_ADMIN", fullName: "Hala Mansour", phoneVerified: true, emailVerified: true, mfaEnabled: true, locale: "en" } });
  const supportUser = await prisma.user.create({ data: { email: "support@saferide.demo", phone: "+201000000002", passwordHash, role: "SUPPORT", fullName: "Youssef Ibrahim", phoneVerified: true, emailVerified: true } });

  const schoolAdminA = await prisma.user.create({ data: { email: "principal@nis.demo", phone: "+201000000010", passwordHash, role: "SCHOOL_ADMIN", fullName: "Dr. Nadia Fahmy", phoneVerified: true, emailVerified: true } });
  const schoolAdminB = await prisma.user.create({ data: { email: "principal@pls.demo", phone: "+201000000011", passwordHash, role: "SCHOOL_ADMIN", fullName: "Mr. Tarek Sobhy", phoneVerified: true, emailVerified: true } });
  await prisma.schoolStaff.create({ data: { schoolId: schoolA.id, userId: schoolAdminA.id, title: "Transport Coordinator", permissions: JSON.stringify(["reports:export", "routes:view"]) } });
  await prisma.schoolStaff.create({ data: { schoolId: schoolB.id, userId: schoolAdminB.id, title: "Principal", permissions: JSON.stringify(["reports:export"]) } });

  const driverUser1 = await prisma.user.create({ data: { email: "driver1@saferide.demo", phone: "+201000000101", passwordHash, role: "DRIVER", fullName: "Mahmoud El-Sayed", phoneVerified: true, emailVerified: true } });
  const driverUser2 = await prisma.user.create({ data: { email: "driver2@saferide.demo", phone: "+201000000102", passwordHash, role: "DRIVER", fullName: "Karim Abdel-Aziz", phoneVerified: true, emailVerified: true } });
  const driverUser3 = await prisma.user.create({ data: { email: "driver3@saferide.demo", phone: "+201000000103", passwordHash, role: "DRIVER", fullName: "Sami Hassan", phoneVerified: true, emailVerified: true, isActive: false } });

  const driver1 = await prisma.driver.create({ data: { userId: driverUser1.id, licenseNumber: "EG-DL-778812", licenseExpiry: daysAhead(400), status: "VERIFIED", rating: 4.9, totalTrips: 812, busId: bus1.id, schoolId: schoolA.id } });
  const driver2 = await prisma.driver.create({ data: { userId: driverUser2.id, licenseNumber: "EG-DL-334455", licenseExpiry: daysAhead(320), status: "VERIFIED", rating: 4.7, totalTrips: 540, busId: bus2.id, schoolId: schoolB.id } });
  await prisma.driver.create({ data: { userId: driverUser3.id, licenseNumber: "EG-DL-009988", licenseExpiry: daysAhead(-10), status: "SUSPENDED", rating: 3.2, totalTrips: 60, busId: bus3.id, schoolId: schoolA.id } });

  // --- Parents -------------------------------------------------------------
  const parent1 = await prisma.user.create({ data: { email: "parent1@saferide.demo", phone: "+201000000201", passwordHash, role: "PARENT", fullName: "Ahmed Hassan", phoneVerified: true, emailVerified: true } });
  const coGuardian1 = await prisma.user.create({ data: { email: "parent1b@saferide.demo", phone: "+201000000202", passwordHash, role: "PARENT", fullName: "Mona Hassan", phoneVerified: true } });
  const parent2 = await prisma.user.create({ data: { email: "parent2@saferide.demo", phone: "+201000000203", passwordHash, role: "PARENT", fullName: "Ali Abdel-Rahman", phoneVerified: true } });

  for (const p of [parent1, coGuardian1, parent2]) {
    await prisma.parentProfile.create({ data: { userId: p.id, alternatePhone: "+20 111 000 9999" } });
    await prisma.notificationPreference.create({ data: { userId: p.id } });
  }

  // --- Addresses -----------------------------------------------------------
  const homeAhmed = await prisma.address.create({ data: { label: "Hassan Family Home", line1: "22 Mostafa El-Nahhas St", area: "Nasr City", city: "Cairo", lat: 30.0655, lng: 31.3431 } });
  const homeAli = await prisma.address.create({ data: { label: "Ali Family Home", line1: "8 Gamaet El Dowal, Mohandessin", area: "Mohandessin", city: "Giza", lat: 30.0561, lng: 31.2019 } });

  // --- Students ------------------------------------------------------------
  const ahmed = await prisma.student.create({ data: { firstName: "Ahmed", lastName: "Hassan", grade: "3", classroom: "3B", gender: "MALE", dateOfBirth: new Date("2017-04-12"), schoolId: schoolA.id, homeAddressId: homeAhmed.id, photoUrl: null } });
  const sara = await prisma.student.create({ data: { firstName: "Sara", lastName: "Hassan", grade: "1", classroom: "1A", gender: "FEMALE", dateOfBirth: new Date("2019-09-03"), schoolId: schoolA.id, homeAddressId: homeAhmed.id } });
  const omar = await prisma.student.create({ data: { firstName: "Omar", lastName: "Abdel-Rahman", grade: "5", classroom: "5C", gender: "MALE", dateOfBirth: new Date("2015-01-22"), schoolId: schoolB.id, homeAddressId: homeAli.id } });

  // Guardians (multiple guardians per child)
  await prisma.guardianRelationship.createMany({
    data: [
      { studentId: ahmed.id, userId: parent1.id, relation: "FATHER", isPrimary: true, canPickup: true },
      { studentId: ahmed.id, userId: coGuardian1.id, relation: "MOTHER", isPrimary: false, canPickup: true },
      { studentId: sara.id, userId: parent1.id, relation: "FATHER", isPrimary: true, canPickup: true },
      { studentId: sara.id, userId: coGuardian1.id, relation: "MOTHER", isPrimary: false, canPickup: true },
      { studentId: omar.id, userId: parent2.id, relation: "FATHER", isPrimary: true, canPickup: true },
    ],
  });

  await prisma.emergencyContact.createMany({
    data: [
      { studentId: ahmed.id, name: "Mona Hassan", relation: "Mother", phone: "+201000000202", isPrimary: true },
      { studentId: ahmed.id, name: "Grandma Zeinab", relation: "Grandmother", phone: "+201000000300", isPrimary: false },
      { studentId: sara.id, name: "Mona Hassan", relation: "Mother", phone: "+201000000202", isPrimary: true },
      { studentId: omar.id, name: "Fatma Abdel-Rahman", relation: "Mother", phone: "+201000000204", isPrimary: true },
    ],
  });

  await prisma.authorizedPickupPerson.createMany({
    data: [
      { studentId: ahmed.id, name: "Mona Hassan", relation: "Mother", phone: "+201000000202", pin: "4821", isActive: true },
      { studentId: ahmed.id, name: "Uncle Khaled", relation: "Uncle", phone: "+201000000305", pin: "7712", isActive: true },
      { studentId: sara.id, name: "Mona Hassan", relation: "Mother", phone: "+201000000202", pin: "4821", isActive: true },
      { studentId: omar.id, name: "Fatma Abdel-Rahman", relation: "Mother", phone: "+201000000204", pin: "9034", isActive: true },
    ],
  });

  await prisma.schoolEnrollment.createMany({
    data: [
      { studentId: ahmed.id, schoolId: schoolA.id, academicYear: "2025/2026", grade: "3", classroom: "3B", status: "ACTIVE" },
      { studentId: sara.id, schoolId: schoolA.id, academicYear: "2025/2026", grade: "1", classroom: "1A", status: "ACTIVE" },
      { studentId: omar.id, schoolId: schoolB.id, academicYear: "2025/2026", grade: "5", classroom: "5C", status: "ACTIVE" },
    ],
  });

  // --- Routes & stops ------------------------------------------------------
  const routeAMorning = await prisma.route.create({
    data: { name: "NIS Morning Route A", schoolId: schoolA.id, direction: "MORNING", distanceKm: 7.4, estDurationMin: 28, status: "ACTIVE",
      stops: { create: [
        { studentId: ahmed.id, sequence: 1, stopType: "PICKUP", lat: homeAhmed.lat, lng: homeAhmed.lng, addressLabel: "22 Mostafa El-Nahhas St", scheduledTime: "06:55" },
        { studentId: sara.id, sequence: 2, stopType: "PICKUP", lat: homeAhmed.lat, lng: homeAhmed.lng, addressLabel: "22 Mostafa El-Nahhas St", scheduledTime: "06:57" },
        { sequence: 3, stopType: "DROPOFF", lat: schoolA.lat, lng: schoolA.lng, addressLabel: "Nile International School", scheduledTime: "07:25" },
      ] } },
  });
  const routeAAfternoon = await prisma.route.create({
    data: { name: "NIS Afternoon Route A", schoolId: schoolA.id, direction: "AFTERNOON", distanceKm: 7.4, estDurationMin: 30, status: "ACTIVE",
      stops: { create: [
        { sequence: 1, stopType: "PICKUP", lat: schoolA.lat, lng: schoolA.lng, addressLabel: "Nile International School", scheduledTime: "14:35" },
        { studentId: ahmed.id, sequence: 2, stopType: "DROPOFF", lat: homeAhmed.lat, lng: homeAhmed.lng, addressLabel: "22 Mostafa El-Nahhas St", scheduledTime: "15:05" },
        { studentId: sara.id, sequence: 3, stopType: "DROPOFF", lat: homeAhmed.lat, lng: homeAhmed.lng, addressLabel: "22 Mostafa El-Nahhas St", scheduledTime: "15:06" },
      ] } },
  });
  const routeBMorning = await prisma.route.create({
    data: { name: "PLS Morning Route A", schoolId: schoolB.id, direction: "MORNING", distanceKm: 9.1, estDurationMin: 34, status: "ACTIVE",
      stops: { create: [
        { studentId: omar.id, sequence: 1, stopType: "PICKUP", lat: homeAli.lat, lng: homeAli.lng, addressLabel: "8 Gamaet El Dowal, Mohandessin", scheduledTime: "06:45" },
        { sequence: 2, stopType: "DROPOFF", lat: schoolB.lat, lng: schoolB.lng, addressLabel: "Pyramids Language School", scheduledTime: "07:20" },
      ] } },
  });
  await prisma.route.create({
    data: { name: "PLS Afternoon Route A", schoolId: schoolB.id, direction: "AFTERNOON", distanceKm: 9.1, estDurationMin: 36, status: "ACTIVE",
      stops: { create: [
        { sequence: 1, stopType: "PICKUP", lat: schoolB.lat, lng: schoolB.lng, addressLabel: "Pyramids Language School", scheduledTime: "14:05" },
        { studentId: omar.id, sequence: 2, stopType: "DROPOFF", lat: homeAli.lat, lng: homeAli.lng, addressLabel: "8 Gamaet El Dowal, Mohandessin", scheduledTime: "14:40" },
      ] } },
  });

  // --- Subscriptions, invoices, payments -----------------------------------
  async function subscriptionFor(student: { id: string }, parent: { id: string }, planId: string, price: number, discount: number, startOffset: number) {
    const sub = await prisma.subscription.create({
      data: { parentId: parent.id, studentId: student.id, planId, status: "ACTIVE", startDate: daysAgo(startOffset), endDate: daysAhead(30 - startOffset), autoRenew: true, priceEGP: price, discountEGP: discount },
    });
    const invoice = await prisma.invoice.create({
      data: { subscriptionId: sub.id, parentId: parent.id, number: `INV-${sub.id.slice(-6).toUpperCase()}`, amountEGP: price, taxEGP: Math.round(price * 0.14), totalEGP: Math.round(price * 1.14), status: "PAID", dueDate: daysAgo(startOffset - 2), paidAt: daysAgo(startOffset - 1) },
    });
    await prisma.payment.create({
      data: { subscriptionId: sub.id, parentId: parent.id, amountEGP: invoice.totalEGP, method: "CARD", status: "SUCCEEDED", provider: "PAYMOB", providerRef: `paymob_${sub.id.slice(-8)}`, idempotencyKey: `seed-${sub.id}`, paidAt: daysAgo(startOffset - 1) },
    });
    return sub;
  }
  await subscriptionFor(ahmed, parent1, planRoundMonthly.id, 1500, 150, 12);
  await subscriptionFor(sara, parent1, planRoundMonthly.id, 1500, 150, 12);
  await subscriptionFor(omar, parent2, planOneWayMonthly.id, 950, 0, 5);

  // --- Today's active trip (morning) --------------------------------------
  const tripMorning = await prisma.trip.create({
    data: { routeId: routeAMorning.id, driverId: driver1.id, busId: bus1.id, schoolId: schoolA.id, direction: "MORNING", tripDate: at(0), status: "IN_PROGRESS", startedAt: new Date(Date.now() - 22 * 60 * 1000) },
  });
  await prisma.studentTripAssignment.create({ data: { tripId: tripMorning.id, studentId: ahmed.id, status: "ONBOARD", boardedAt: new Date(Date.now() - 12 * 60 * 1000), seatNo: "3" } });
  await prisma.studentTripAssignment.create({ data: { tripId: tripMorning.id, studentId: sara.id, status: "EXPECTED", seatNo: "4" } });
  await prisma.boardingEvent.create({ data: { tripId: tripMorning.id, studentId: ahmed.id, driverId: driver1.id, lat: homeAhmed.lat, lng: homeAhmed.lng, method: "PIN", occurredAt: new Date(Date.now() - 12 * 60 * 1000) } });

  // A recent completed trip (yesterday)
  const tripYesterday = await prisma.trip.create({
    data: { routeId: routeAAfternoon.id, driverId: driver1.id, busId: bus1.id, schoolId: schoolA.id, direction: "AFTERNOON", tripDate: daysAgo(1), status: "COMPLETED", startedAt: daysAgo(1), endedAt: daysAgo(1), reconciliationComplete: true },
  });
  await prisma.studentTripAssignment.createMany({ data: [
    { tripId: tripYesterday.id, studentId: ahmed.id, status: "DROPPED", boardedAt: daysAgo(1), droppedAt: daysAgo(1), recipientName: "Mona Hassan" },
    { tripId: tripYesterday.id, studentId: sara.id, status: "DROPPED", boardedAt: daysAgo(1), droppedAt: daysAgo(1), recipientName: "Mona Hassan" },
  ] });

  // GPS breadcrumb for the active trip (a short track heading to the pickup)
  const track = [
    { lat: 30.0620, lng: 31.3390, speed: 22 },
    { lat: 30.0638, lng: 31.3402, speed: 18 },
    { lat: 30.0651, lng: 31.3425, speed: 12 },
    { lat: 30.0655, lng: 31.3431, speed: 4 },
  ];
  let idx = 0;
  for (const p of track) {
    await prisma.gpsLocationUpdate.create({ data: { tripId: tripMorning.id, busId: bus1.id, lat: p.lat, lng: p.lng, speed: p.speed, heading: 45, accuracy: 6, recordedAt: new Date(Date.now() - (track.length - idx) * 60 * 1000) } });
    idx++;
  }

  // --- Notifications -------------------------------------------------------
  await prisma.notification.createMany({ data: [
    { userId: parent1.id, type: "BUS_STARTED", title: "Bus started route", body: "Bus BUS-101 (Mahmoud El-Sayed) started the morning route.", severity: "INFO", createdAt: new Date(Date.now() - 22 * 60 * 1000) },
    { userId: parent1.id, type: "STUDENT_BOARDED", title: "Ahmed is on board", body: "Ahmed boarded the bus at 22 Mostafa El-Nahhas St.", severity: "SUCCESS", createdAt: new Date(Date.now() - 12 * 60 * 1000) },
    { userId: parent1.id, type: "BUS_APPROACHING", title: "Bus is 5 minutes away", body: "Bus BUS-101 is about 5 minutes from Sara's pickup point.", severity: "WARNING", createdAt: new Date(Date.now() - 3 * 60 * 1000) },
    { userId: parent2.id, type: "SUBSCRIPTION_RENEWED", title: "Subscription renewed", body: "Omar's monthly subscription was renewed.", severity: "SUCCESS", createdAt: daysAgo(5) },
    { userId: schoolAdminA.id, type: "ROUTE_DEVIATION", title: "Route deviation", body: "Bus BUS-101 deviated 300m from the planned route.", severity: "WARNING", createdAt: new Date(Date.now() - 8 * 60 * 1000) },
  ] });

  // --- Support & incidents -------------------------------------------------
  const ticket = await prisma.supportTicket.create({ data: { requesterId: parent2.id, category: "LATE_BUS", subject: "Bus was 20 minutes late", body: "Yesterday the afternoon bus arrived 20 minutes late.", status: "IN_PROGRESS", priority: "NORMAL", assigneeId: supportUser.id } });
  await prisma.ticketMessage.createMany({ data: [
    { ticketId: ticket.id, authorId: parent2.id, body: "Can you please check what happened?" },
    { ticketId: ticket.id, authorId: supportUser.id, body: "We are investigating the delay with the driver. We'll update you shortly." },
  ] });

  await prisma.safetyIncident.create({ data: { tripId: tripMorning.id, studentId: null, schoolId: schoolA.id, reportedById: driverUser1.id, type: "DELAY", severity: "LOW", description: "Heavy traffic on Abbas El Akkad caused a 6 minute delay.", status: "ACKNOWLEDGED" } });

  await prisma.auditLog.create({ data: { actorId: superAdmin.id, action: "SEED_DATA", entity: "System", metadata: JSON.stringify({ version: 1 }) } });

  console.log("Seed complete.");
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
  console.log("Accounts: admin@saferide.demo, principal@nis.demo, driver1@saferide.demo, parent1@saferide.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
