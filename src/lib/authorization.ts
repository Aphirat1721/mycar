import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { PermissionKey, RoleKey } from "@/generated/prisma/client";

export async function hasApplicationRole(
  userId: string,
  applicationCode: string,
  roleKeys: RoleKey[] = ["ADMIN", "SUPER_ADMIN"],
) {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role: {
        key: { in: roleKeys },
        application: { code: applicationCode },
      },
    },
  });
  return count > 0;
}

export async function requireAdmin(applicationCode = "MYCAR") {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!(await hasApplicationRole(user.id, applicationCode))) throw new Error("FORBIDDEN");
  return user;
}

export async function requireSuperAdmin(applicationCode = "MYCAR") {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!(await hasApplicationRole(user.id, applicationCode, ["SUPER_ADMIN"]))) throw new Error("FORBIDDEN");
  return user;
}

export async function hasPermission(
  userId: string,
  permissionKey: PermissionKey,
  applicationCode = "MYCAR",
) {
  const count = await prisma.rolePermission.count({
    where: {
      permission: {
        key: permissionKey,
        application: { code: applicationCode },
      },
      role: {
        application: { code: applicationCode },
        userRoles: { some: { userId } },
      },
    },
  });
  return count > 0;
}

export async function requirePermission(
  permissionKey: PermissionKey,
  applicationCode = "MYCAR",
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!(await hasPermission(user.id, permissionKey, applicationCode))) throw new Error("FORBIDDEN");
  return user;
}
