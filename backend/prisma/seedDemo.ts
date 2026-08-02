import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

async function main() {
  const [admin, receptionist, technician] = await Promise.all([
    prisma.user.findUnique({ where: { email: "admin@repairtrack.local" } }),
    prisma.user.findUnique({
      where: { email: "receptionist@repairtrack.local" },
    }),
    prisma.user.findUnique({
      where: { email: "technician@repairtrack.local" },
    }),
  ]);

  if (!admin || !receptionist || !technician) {
    throw new Error("Run npm run seed before npm run seed:demo");
  }

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { customerCode: "CUS-9001" },
      update: {},
      create: {
        customerCode: "CUS-9001",
        name: "Nimal Perera",
        phone: "0771234567",
        email: "nimal@example.com",
        address: "Colombo",
      },
    }),
    prisma.customer.upsert({
      where: { customerCode: "CUS-9002" },
      update: {},
      create: {
        customerCode: "CUS-9002",
        name: "Kavindi Silva",
        phone: "0719876543",
        email: "kavindi@example.com",
        address: "Kandy",
      },
    }),
    prisma.customer.upsert({
      where: { customerCode: "CUS-9003" },
      update: {},
      create: {
        customerCode: "CUS-9003",
        name: "Sahan Fernando",
        phone: "0765551234",
        address: "Galle",
      },
    }),
  ]);

  const devices = await Promise.all([
    prisma.device.upsert({
      where: { deviceCode: "DEV-9001" },
      update: {},
      create: {
        deviceCode: "DEV-9001",
        customerId: customers[0].id,
        deviceType: "LAPTOP",
        brand: "Dell",
        model: "Inspiron 15",
        serialNumber: "DEMO-DELL-001",
        colour: "Black",
        condition: "Does not power on",
        accessories: ["Charger"],
      },
    }),
    prisma.device.upsert({
      where: { deviceCode: "DEV-9002" },
      update: {},
      create: {
        deviceCode: "DEV-9002",
        customerId: customers[1].id,
        deviceType: "MOBILE_PHONE",
        brand: "Samsung",
        model: "Galaxy A54",
        serialNumber: "DEMO-SAM-002",
        colour: "Blue",
        condition: "Cracked display",
        accessories: [],
      },
    }),
    prisma.device.upsert({
      where: { deviceCode: "DEV-9003" },
      update: {},
      create: {
        deviceCode: "DEV-9003",
        customerId: customers[2].id,
        deviceType: "PRINTER",
        brand: "HP",
        model: "LaserJet Pro",
        serialNumber: "DEMO-HP-003",
        colour: "White",
        condition: "Paper feed problem",
        accessories: ["Power cable"],
      },
    }),
  ]);

  const year = new Date().getUTCFullYear();
  const demoRepairs = [
    {
      number: `REP-${year}-9001`,
      customer: customers[0],
      device: devices[0],
      status: "REPAIR_IN_PROGRESS" as const,
      priority: "HIGH" as const,
      problem: "Laptop does not power on",
      findings: "Charging circuit component failed",
      cost: 8500,
      note: "Repair work is in progress",
    },
    {
      number: `REP-${year}-9002`,
      customer: customers[1],
      device: devices[1],
      status: "READY_FOR_COLLECTION" as const,
      priority: "NORMAL" as const,
      problem: "Display is cracked and touch is intermittent",
      findings: "Display assembly replaced and tested",
      cost: 22000,
      note: "Device is ready for collection",
    },
    {
      number: `REP-${year}-9003`,
      customer: customers[2],
      device: devices[2],
      status: "UNDER_INSPECTION" as const,
      priority: "NORMAL" as const,
      problem: "Printer does not feed paper correctly",
      findings: "Inspecting pickup roller and feed mechanism",
      cost: 3500,
      note: "Technician inspection has started",
    },
  ];

  for (const item of demoRepairs) {
    const repair = await prisma.repairJob.upsert({
      where: { repairNumber: item.number },
      update: {
        assignedTechnicianId: technician.id,
        status: item.status,
        inspectionFindings: item.findings,
        estimatedCost: item.cost,
      },
      create: {
        repairNumber: item.number,
        customerId: item.customer.id,
        deviceId: item.device.id,
        createdById: receptionist.id,
        assignedTechnicianId: technician.id,
        reportedProblem: item.problem,
        priority: item.priority,
        status: item.status,
        inspectionFindings: item.findings,
        estimatedCost: item.cost,
        estimatedCompletionDate: new Date(Date.now() + 3 * 86400000),
      },
    });
    const historyCount = await prisma.repairStatusHistory.count({
      where: { repairJobId: repair.id },
    });
    if (historyCount === 0) {
      await prisma.repairStatusHistory.createMany({
        data: [
          {
            repairJobId: repair.id,
            status: "DEVICE_RECEIVED",
            updatedById: receptionist.id,
            publicNote: "Device received by the repair centre",
          },
          {
            repairJobId: repair.id,
            status: item.status,
            updatedById: technician.id,
            publicNote: item.note,
            internalNote: "Demo repair record",
          },
        ],
      });
    }
  }

  const demoParts = [
    {
      sku: "BAT-LAP-001",
      name: "Laptop battery",
      quantity: 8,
      reorderLevel: 3,
      unitCost: 6500,
      sellingPrice: 8500,
    },
    {
      sku: "SSD-512-001",
      name: "512 GB SSD",
      quantity: 12,
      reorderLevel: 4,
      unitCost: 9000,
      sellingPrice: 11500,
    },
    {
      sku: "SCR-A54-001",
      name: "Galaxy A54 display",
      quantity: 4,
      reorderLevel: 2,
      unitCost: 17500,
      sellingPrice: 22000,
    },
  ];
  for (const item of demoParts) {
    const part = await prisma.sparePart.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
    const movementCount = await prisma.stockMovement.count({
      where: { sparePartId: part.id },
    });
    if (movementCount === 0 && part.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          sparePartId: part.id,
          type: "PURCHASE",
          quantity: part.quantity,
          note: "Demo opening stock",
        },
      });
    }
  }

  const invoicedRepair = await prisma.repairJob.findUniqueOrThrow({
    where: { repairNumber: `REP-${year}-9002` },
  });
  const quotation = await prisma.quotation.upsert({
    where: { quotationNumber: "QUO-9001" },
    update: {},
    create: {
      quotationNumber: "QUO-9001",
      repairJobId: invoicedRepair.id,
      customerId: invoicedRepair.customerId,
      status: "APPROVED",
      subtotal: 22000,
      tax: 0,
      total: 22000,
      notes: "Demo approved display replacement quotation",
      sentAt: new Date(),
      respondedAt: new Date(),
      items: {
        create: [
          {
            description: "Galaxy A54 display replacement",
            quantity: 1,
            unitPrice: 22000,
            lineTotal: 22000,
          },
        ],
      },
    },
  });
  const invoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-9001" },
    update: {},
    create: {
      invoiceNumber: "INV-9001",
      repairJobId: invoicedRepair.id,
      customerId: invoicedRepair.customerId,
      quotationId: quotation.id,
      subtotal: 22000,
      tax: 0,
      total: 22000,
      paidAmount: 5000,
      balance: 17000,
      status: "PARTIALLY_PAID",
    },
  });
  await prisma.payment.upsert({
    where: { providerReference: "DEMO-PAYMENT-9001" },
    update: {},
    create: {
      invoiceId: invoice.id,
      amount: 5000,
      method: "CASH",
      status: "COMPLETED",
      providerReference: "DEMO-PAYMENT-9001",
      note: "Demo advance payment",
      paidAt: new Date(),
    },
  });

  const inspectionRepair = await prisma.repairJob.findUniqueOrThrow({
    where: { repairNumber: demoRepairs[2].number },
  });
  const activeRepair = await prisma.repairJob.findUniqueOrThrow({
    where: { repairNumber: demoRepairs[0].number },
  });
  const demoNotifications = [
    {
      userId: admin.id,
      title: "Demo repair requires review",
      message: `${demoRepairs[2].number} is currently under inspection.`,
      repairJobId: inspectionRepair.id,
    },
    {
      userId: receptionist.id,
      title: "Demo device ready for collection",
      message: `${demoRepairs[1].number} is ready to hand over to the customer.`,
      repairJobId: invoicedRepair.id,
    },
    {
      userId: technician.id,
      title: "Demo assigned repair",
      message: `${demoRepairs[0].number} is in your active work queue.`,
      repairJobId: activeRepair.id,
    },
    {
      userId: admin.id,
      title: "Demo spare part requested",
      message: `${demoRepairs[0].number}: technician requested 2 × 512 GB SSD.`,
      repairJobId: activeRepair.id,
    },
  ];
  for (const item of demoNotifications) {
    const exists = await prisma.notification.findFirst({
      where: { userId: item.userId, title: item.title },
    });
    if (!exists) await prisma.notification.create({ data: item });
  }
  const demoRequestedPart = await prisma.sparePart.findUniqueOrThrow({
    where: { sku: "SSD-512-001" },
  });
  const existingPartRequest = await prisma.sparePartRequest.findFirst({
    where: {
      repairJobId: activeRepair.id,
      requestedById: technician.id,
      partName: demoRequestedPart.name,
      status: "PENDING",
    },
  });
  if (!existingPartRequest) {
    await prisma.sparePartRequest.create({
      data: {
        repairJobId: activeRepair.id,
        requestedById: technician.id,
        sparePartId: demoRequestedPart.id,
        partName: demoRequestedPart.name,
        quantity: 2,
        note: "Demo technician request for the active repair",
      },
    });
  }

  console.log(
    "Demo data created: customers, devices, repairs, spare parts, part request, quotation, invoice, payment and notifications.",
  );
  console.log(
    `Public tracking example: REP-${year}-9002 with phone 0719876543`,
  );
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
