import { prisma } from "../config/prisma.js";
import { deleteExpiredRefreshTokens } from "../services/auth.service.js";

try {
  const count = await deleteExpiredRefreshTokens();
  const passwordResetTokens = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });
  console.log(`Removed ${count} expired or revoked refresh token(s).`);
  console.log(`Removed ${passwordResetTokens.count} expired or used password reset token(s).`);
} finally {
  await prisma.$disconnect();
}
