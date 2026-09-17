import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/generated/prisma/client";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const allowed = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
  if (!allowed) throw new Error("FORBIDDEN");
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const allowed = user.roles.some(({ role }) => role.key === "SUPER_ADMIN");
  if (!allowed) throw new Error("FORBIDDEN");
  return user;
}

export async function hasPermission(userId: string, permissionKey: PermissionKey) {
  const count = await prisma.rolePermission.count({
    where: {
      permission: { key: permissionKey },
      role: { userRoles: { some: { userId } } },
    },
  });
  return count > 0;
}

export async function requirePermission(permissionKey: PermissionKey) {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!(await hasPermission(user.id, permissionKey))) throw new Error("FORBIDDEN");
  return user;
}
