import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const [admin, receptionist, technician] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@repairtrack.local" } }),
    prisma.user.findUnique({ where: { email: "receptionist@repairtrack.local" } }),
    prisma.user.findUnique({ where: { email: "technician@repairtrack.local" } }),
  ]);

  if (!admin || !receptionist || !technician) {
    throw new Error("Run npm run seed before npm run seed:demo");
  }

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { customerCode: "CUS-9001" },
      update: {},
      create: { customerCode: "CUS-9001", name: "Nimal Perera", phone: "0771234567", email: "nimal@example.com", address: "Colombo" },
    }),
    prisma.customer.upsert({
      where: { customerCode: "CUS-9002" },
      update: {},
      create: { customerCode: "CUS-9002", name: "Kavindi Silva", phone: "0719876543", email: "kavindi@example.com", address: "Kandy" },
    }),
    prisma.customer.upsert({
      where: { customerCode: "CUS-9003" },
      update: {},
      create: { customerCode: "CUS-9003", name: "Sahan Fernando", phone: "0765551234", address: "Galle" },
    }),
  ]);

  const devices = await Promise.all([
    prisma.device.upsert({
      where: { deviceCode: "DEV-9001" }, update: {},
      create: { deviceCode: "DEV-9001", customerId: customers[0].id, deviceType: "LAPTOP", brand: "Dell", model: "Inspiron 15", serialNumber: "DEMO-DELL-001", colour: "Black", condition: "Does not power on", accessories: ["Charger"] },
    }),
    prisma.device.upsert({
      where: { deviceCode: "DEV-9002" }, update: {},
      create: { deviceCode: "DEV-9002", customerId: customers[1].id, deviceType: "MOBILE_PHONE", brand: "Samsung", model: "Galaxy A54", serialNumber: "DEMO-SAM-002", colour: "Blue", condition: "Cracked display", accessories: [] },
    }),
    prisma.device.upsert({
      where: { deviceCode: "DEV-9003" }, update: {},
      create: { deviceCode: "DEV-9003", customerId: customers[2].id, deviceType: "PRINTER", brand: "HP", model: "LaserJet Pro", serialNumber: "DEMO-HP-003", colour: "White", condition: "Paper feed problem", accessories: ["Power cable"] },
    }),
  ]);

  const year = new Date().getUTCFullYear();
  const demoRepairs = [
    { number: `REP-${year}-9001`, customer: customers[0], device: devices[0], status: "REPAIR_IN_PROGRESS" as const, priority: "HIGH" as const, problem: "Laptop does not power on", findings: "Charging circuit component failed", cost: 8500, note: "Repair work is in progress" },
    { number: `REP-${year}-9002`, customer: customers[1], device: devices[1], status: "READY_FOR_COLLECTION" as const, priority: "NORMAL" as const, problem: "Display is cracked and touch is intermittent", findings: "Display assembly replaced and tested", cost: 22000, note: "Device is ready for collection" },
    { number: `REP-${year}-9003`, customer: customers[2], device: devices[2], status: "UNDER_INSPECTION" as const, priority: "NORMAL" as const, problem: "Printer does not feed paper correctly", findings: "Inspecting pickup roller and feed mechanism", cost: 3500, note: "Technician inspection has started" },
  ];

  for (const item of demoRepairs) {
    const repair = await prisma.repairJob.upsert({
      where: { repairNumber: item.number },
      update: { assignedTechnicianId: technician.id, status: item.status, inspectionFindings: item.findings, estimatedCost: item.cost },
      create: { repairNumber: item.number, customerId: item.customer.id, deviceId: item.device.id, createdById: receptionist.id, assignedTechnicianId: technician.id, reportedProblem: item.problem, priority: item.priority, status: item.status, inspectionFindings: item.findings, estimatedCost: item.cost, estimatedCompletionDate: new Date(Date.now() + 3 * 86400000) },
    });
    const historyCount = await prisma.repairStatusHistory.count({ where: { repairJobId: repair.id } });
    if (historyCount === 0) {
      await prisma.repairStatusHistory.createMany({ data: [
        { repairJobId: repair.id, status: "DEVICE_RECEIVED", updatedById: receptionist.id, publicNote: "Device received by the repair centre" },
        { repairJobId: repair.id, status: item.status, updatedById: technician.id, publicNote: item.note, internalNote: "Demo repair record" },
      ] });
    }
  }

  console.log("Demo data created: 3 customers, 3 devices and 3 repairs.");
  console.log(`Public tracking example: REP-${year}-9002 with phone 0719876543`);
}

main().catch((error) => { console.error("Demo seed failed:", error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
