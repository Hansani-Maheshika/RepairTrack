import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { CreateUserInput, UpdateUserInput, UserQuery } from "../validators/user.validator.js";

const safeUserSelect = {
  id: true, staffCode: true, fullName: true, email: true, role: true,
  isActive: true, mustChangePassword: true, createdAt: true, updatedAt: true,
};

export async function listUsers(query: UserQuery) {
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search ? { OR: [
      { staffCode: { contains: query.search, mode: "insensitive" as const } },
      { fullName: { contains: query.search, mode: "insensitive" as const } },
      { email: { contains: query.search, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: safeUserSelect,
      skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { fullName: "asc" } }),
    prisma.user.count({ where }),
  ]);
  return { users, pagination: { page: query.page, limit: query.limit, total,
    pages: Math.ceil(total / query.limit) } };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) throw new AppError("Staff account was not found", 404);
  return user;
}

export async function createUser(input: CreateUserInput) {
  const { password, ...data } = input;
  return prisma.user.create({ data: {
    ...data,
    passwordHash: await bcrypt.hash(password, 12),
    mustChangePassword: true,
  },
    select: safeUserSelect });
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  await getUser(id);
  if (id === actorId && input.isActive === false) {
    throw new AppError("You cannot deactivate your own account", 409);
  }
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data: input, select: safeUserSelect });
    if (input.isActive === false) {
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() } });
    }
    return user;
  });
}

export async function resetUserPassword(id: string, password: string) {
  await getUser(id);
  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
      },
    }),
    prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() } }),
  ]);
}
