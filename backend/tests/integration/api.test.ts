import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { createAccessToken } from "../../src/utils/jwt.js";

const integration = describe.runIf(process.env.RUN_INTEGRATION_TESTS === "true");

integration("RepairTrack API integration", () => {
  const marker = randomUUID().slice(0, 8);
  const ids: { admin?: string; receptionist?: string; technician?: string;
    customer?: string; device?: string; repair?: string } = {};
  let adminToken = "";
  let receptionistToken = "";
  let technicianToken = "";
  let repairNumber = "";
  const phone = `077${Date.now().toString().slice(-7)}`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("IntegrationPass123!", 4);
    const [admin, receptionist, technician] = await Promise.all([
      prisma.user.create({ data: { staffCode: `TST-A-${marker}`, fullName: "Test Admin",
        email: `admin-${marker}@test.local`, passwordHash, role: "ADMIN" } }),
      prisma.user.create({ data: { staffCode: `TST-R-${marker}`, fullName: "Test Receptionist",
        email: `reception-${marker}@test.local`, passwordHash, role: "RECEPTIONIST" } }),
      prisma.user.create({ data: { staffCode: `TST-T-${marker}`, fullName: "Test Technician",
        email: `technician-${marker}@test.local`, passwordHash, role: "TECHNICIAN" } }),
    ]);
    ids.admin = admin.id; ids.receptionist = receptionist.id; ids.technician = technician.id;
    adminToken = createAccessToken(admin.id, "ADMIN");
    receptionistToken = createAccessToken(receptionist.id, "RECEPTIONIST");
    technicianToken = createAccessToken(technician.id, "TECHNICIAN");
  });

  afterAll(async () => {
    if (ids.repair) await prisma.repairStatusHistory.deleteMany({ where: { repairJobId: ids.repair } });
    if (ids.repair) await prisma.repairJob.deleteMany({ where: { id: ids.repair } });
    if (ids.device) await prisma.device.deleteMany({ where: { id: ids.device } });
    if (ids.customer) await prisma.customer.deleteMany({ where: { id: ids.customer } });
    const userIds = [ids.admin, ids.receptionist, ids.technician].filter((id): id is string => Boolean(id));
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("exposes health but protects staff resources", async () => {
    expect((await request(app).get("/api/v1/health")).status).toBe(200);
    expect((await request(app).get("/api/v1/users")).status).toBe(401);
    expect((await request(app).get("/api/v1/users").set("Authorization", `Bearer ${receptionistToken}`)).status).toBe(403);
    expect((await request(app).get("/api/v1/users?role=TECHNICIAN").set("Authorization", `Bearer ${adminToken}`)).status).toBe(200);
  });

  it("creates and updates a customer and device", async () => {
    const customerResponse = await request(app).post("/api/v1/customers")
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({ name: "Integration Customer", phone, email: `customer-${marker}@test.local` });
    expect(customerResponse.status).toBe(201);
    ids.customer = customerResponse.body.data.customer.id;
    expect(customerResponse.body.data.customer.customerCode).toMatch(/^CUS-\d{4,}$/);

    const deviceResponse = await request(app).post("/api/v1/devices")
      .set("Authorization", `Bearer ${receptionistToken}`)
      .send({ customerId: ids.customer, deviceType: "LAPTOP", brand: "TestBrand", model: "Model 1" });
    expect(deviceResponse.status).toBe(201);
    ids.device = deviceResponse.body.data.device.id;
    expect(deviceResponse.body.data.device.deviceCode).toMatch(/^DEV-\d{4,}$/);

    const updateResponse = await request(app).patch(`/api/v1/devices/${ids.device}`)
      .set("Authorization", `Bearer ${receptionistToken}`).send({ colour: "Black" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.device.colour).toBe("Black");

    const forbidden = await request(app).get(`/api/v1/customers/${ids.customer}/devices`)
      .set("Authorization", `Bearer ${technicianToken}`);
    expect(forbidden.status).toBe(403);
  });

  it("runs assignment, inspection, status, and public tracking workflow", async () => {
    const createResponse = await request(app).post("/api/v1/repairs")
      .set("Authorization", `Bearer ${receptionistToken}`).send({
        customerId: ids.customer, deviceId: ids.device, assignedTechnicianId: ids.technician,
        reportedProblem: "Device does not power on", priority: "HIGH",
      });
    expect(createResponse.status).toBe(201);
    ids.repair = createResponse.body.data.repair.id;
    repairNumber = createResponse.body.data.repair.repairNumber;

    const inspection = await request(app).patch(`/api/v1/repairs/${ids.repair}/inspection`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ inspectionFindings: "Power circuit requires repair", estimatedCost: 2500 });
    expect(inspection.status).toBe(200);

    const status = await request(app).patch(`/api/v1/repairs/${ids.repair}/status`)
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({ status: "UNDER_INSPECTION", publicNote: "Inspection started", internalNote: "Private detail" });
    expect(status.status).toBe(200);

    const invalid = await request(app).patch(`/api/v1/repairs/${ids.repair}/status`)
      .set("Authorization", `Bearer ${technicianToken}`).send({ status: "COLLECTED" });
    expect(invalid.status).toBe(409);

    const tracking = await request(app).post("/api/v1/public/repairs/track")
      .send({ repairNumber, phone });
    expect(tracking.status).toBe(200);
    expect(tracking.body.data.repair.status).toBe("UNDER_INSPECTION");
    expect(JSON.stringify(tracking.body)).not.toContain("Private detail");
  });
});

