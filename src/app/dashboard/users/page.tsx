import { requireSuperAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import UsersManager from "@/components/users-manager";

export default async function UsersPage() {
  await requireSuperAdmin();
  const [users, departments, applications] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true, organizationHcode: true, organizationName: true, status: true, departmentId: true, department: { select: { publicId: true, nameTh: true } }, roles: { select: { role: { select: { key: true, nameTh: true, application: { select: { code: true } } } } } }, applications: { select: { applicationId: true } } },
    }),
    prisma.department.findMany({ where: { status: "ACTIVE", deletedAt: null }, orderBy: { nameTh: "asc" }, select: { id: true, publicId: true, nameTh: true } }),
    prisma.application.findMany({ where: { status: "ACTIVE" }, orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, publicId: true, code: true, nameTh: true } }),
  ]);
  return <UsersManager canManageRoles initialUsers={users.map((u) => ({ ...u, id: u.publicId, role: u.roles.find((item) => item.role.application?.code === "MYCAR" && (item.role.key === "ADMIN" || item.role.key === "SUPER_ADMIN" || item.role.key === "VEHICLE_APPROVER" || item.role.key === "DRIVER_EVALUATION_REVIEWER"))?.role.key ?? "USER", meetingRole: u.roles.find((item) => item.role.application?.code === "MEETING_ROOMS")?.role.key ?? "USER", departmentId: u.department?.publicId ?? null, applicationIds: u.applications.map((item) => item.applicationId) }))} departments={departments.map((d) => ({ id: d.id, publicId: d.publicId, nameTh: d.nameTh }))} applications={applications} />;
}
