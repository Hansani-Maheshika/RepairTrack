import { prisma } from "../config/prisma.js";
import { deleteExpiredRefreshTokens } from "../services/auth.service.js";

try {
  const count = await deleteExpiredRefreshTokens();
  console.log(`Removed ${count} expired or revoked refresh token(s).`);
} finally {
  await prisma.$disconnect();
}
