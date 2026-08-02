import { prisma } from "../config/prisma.js";

export async function getDashboardSummary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalCustomers, totalDevices, totalRepairs, receivedToday,
    repairsByStatus, technicianWorkload, recentRepairs,
  ] = await prisma.$transaction([
    prisma.customer.count(),
    prisma.device.count(),
    prisma.repairJob.count(),
    prisma.repairJob.count({ where: { receivedAt: { gte: startOfToday } } }),
    prisma.repairJob.groupBy({
      by: ["status"],
      orderBy: { status: "asc" },
      _count: true,
    }),
    prisma.user.findMany({
      where: { role: "TECHNICIAN", isActive: true },
      select: {
        id: true, staffCode: true, fullName: true,
        _count: { select: { assignedRepairs: {
          where: { status: { notIn: ["COLLECTED", "CANCELLED"] } },
        } } },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.repairJob.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      select: {
        id: true, repairNumber: true, status: true, priority: true,
        receivedAt: true,
        customer: { select: { customerCode: true, name: true } },
        device: { select: { deviceType: true, brand: true, model: true } },
      },
    }),
  ]);

  return {
    totals: { customers: totalCustomers, devices: totalDevices, repairs: totalRepairs,
      repairsReceivedToday: receivedToday },
    repairsByStatus: repairsByStatus.map((item) => ({
      status: item.status, count: item._count,
    })),
    technicianWorkload: technicianWorkload.map((item) => ({
      id: item.id, staffCode: item.staffCode, fullName: item.fullName,
      activeRepairs: item._count.assignedRepairs,
    })),
    recentRepairs,
  };
}
