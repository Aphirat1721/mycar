import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import DriversManager from "@/components/drivers-manager";

export default async function DriversPage() {
  await requireAdmin();
  const [drivers, users] = await Promise.all([
    prisma.driver.findMany({ where: { deletedAt: null }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    prisma.user.findMany({ where: { status: "ACTIVE" }, orderBy: [{ nameTh: "asc" }, { firstnameTh: "asc" }], select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true, driver: { select: { publicId: true, firstName: true, lastName: true } } } }),
  ]);
  return <DriversManager initialDrivers={drivers.map((driver) => ({ id: driver.publicId, firstName: driver.firstName, lastName: driver.lastName, nickname: driver.nickname, photoPath: driver.photoPath, status: driver.status, user: users.find((u) => u.driver?.publicId === driver.publicId) ?? null }))} users={users} />;
}