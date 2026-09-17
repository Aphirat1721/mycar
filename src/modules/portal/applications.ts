import { prisma } from "@/lib/prisma";

export type PortalApplication = {
  publicId: string;
  code: string;
  nameTh: string;
  description: string | null;
  iconKey: string | null;
  basePath: string | null;
  sortOrder: number;
};

export async function getUserApplications(userId: string): Promise<PortalApplication[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: { select: { role: { select: { key: true } } } } } });
  const isSuperAdmin = Boolean(user?.roles.some(({ role }) => role.key === "SUPER_ADMIN"));
  return prisma.application.findMany({
    where: {
      status: "ACTIVE",
      ...(isSuperAdmin ? {} : { userApplications: { some: { userId } } }),
    },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: { publicId: true, code: true, nameTh: true, description: true, iconKey: true, basePath: true, sortOrder: true },
  });
}

export async function getApplicationByCode(code: string): Promise<PortalApplication | null> {
  return prisma.application.findUnique({ where: { code, status: "ACTIVE" }, select: { publicId: true, code: true, nameTh: true, description: true, iconKey: true, basePath: true, sortOrder: true } });
}

export async function hasApplicationAccess(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: { select: { role: { select: { key: true } } } } } });
  const app = await prisma.application.findUnique({ where: { code }, select: { id: true, status: true } });
  if (!app || app.status !== "ACTIVE") return false;
  if (user?.roles.some(({ role }) => role.key === "SUPER_ADMIN")) return true;
  const access = await prisma.userApplication.findUnique({ where: { userId_applicationId: { userId, applicationId: app.id } }, select: { userId: true } });
  return Boolean(access);
}
