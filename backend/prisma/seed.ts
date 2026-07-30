import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/config/prisma.js";

async function main(): Promise<void> {
  const seedPassword = process.env.SEED_USER_PASSWORD;

  if (!seedPassword) {
    throw new Error(
      "SEED_USER_PASSWORD is missing from the backend .env file",
    );
  }

  if (seedPassword.length < 8) {
    throw new Error(
      "SEED_USER_PASSWORD must contain at least 8 characters",
    );
  }

  // Convert the plain development password into a secure hash.
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const staffUsers = [
    {
      staffCode: "STF-0001",
      fullName: "RepairTrack Administrator",
      email: "admin@repairtrack.local",
      role: "ADMIN" as const,
    },
    {
      staffCode: "STF-0002",
      fullName: "RepairTrack Receptionist",
      email: "receptionist@repairtrack.local",
      role: "RECEPTIONIST" as const,
    },
    {
      staffCode: "STF-0003",
      fullName: "RepairTrack Technician",
      email: "technician@repairtrack.local",
      role: "TECHNICIAN" as const,
    },
  ];

  for (const staffUser of staffUsers) {
    await prisma.user.upsert({
      where: {
        email: staffUser.email,
      },

      update: {
        staffCode: staffUser.staffCode,
        fullName: staffUser.fullName,
        role: staffUser.role,
        passwordHash,
        isActive: true,
      },

      create: {
        staffCode: staffUser.staffCode,
        fullName: staffUser.fullName,
        email: staffUser.email,
        role: staffUser.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  console.log("RepairTrack staff seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("RepairTrack seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });