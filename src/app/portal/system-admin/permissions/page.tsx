import Link from "next/link";
import { Power, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import UsersManager from "@/components/users-manager";

export default async function SystemPermissionsPage() {
  const actor = await requireAdmin();
  const canManageRoles = actor.roles.some(({ role }) => role.key === "SUPER_ADMIN");
  const [users, departments, applications, meetingPermissions] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { publicId: true, nameTh: true, firstnameTh: true, lastnameTh: true, organizationHcode: true, organizationName: true, status: true, departmentId: true, department: { select: { publicId: true, nameTh: true } }, roles: { select: { role: { select: { key: true, nameTh: true, application: { select: { code: true } } } } } }, applications: { select: { applicationId: true } } } }),
    prisma.department.findMany({ where: { status: "ACTIVE", deletedAt: null }, orderBy: { nameTh: "asc" }, select: { id: true, publicId: true, nameTh: true } }),
    prisma.application.findMany({ where: { status: "ACTIVE" }, orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, publicId: true, code: true, nameTh: true } }),
    prisma.permission.findMany({ where: { application: { code: "MEETING_ROOMS" } }, orderBy: { key: "asc" }, select: { id: true, key: true, nameTh: true, rolePermissions: { select: { role: { select: { key: true, nameTh: true } } } } } }),

  ]);

  return <section>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold tracking-[0.14em] text-teal-700">ACCESS CONTROL</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">จัดการสิทธิ์การเข้าใช้งานระบบ</h1><p className="mt-2 text-sm text-slate-500">กำหนดสิทธิ์แยกตามโมดูล เพื่อไม่ให้สิทธิ์ของระบบห้องประชุมปะปนกับระบบขอใช้รถยนต์</p></div><Link href="/portal/system-admin/modules" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><Power size={17}/>เปิด / ปิด โมดูล</Link></div>
    <UsersManager canManageRoles={canManageRoles} initialUsers={users.map((u) => ({ ...u, id: u.publicId, role: u.roles.find((item) => item.role.application?.code === "MYCAR")?.role.key ?? "USER", meetingRole: u.roles.find((item) => item.role.application?.code === "MEETING_ROOMS")?.role.key ?? "USER", departmentId: u.department?.publicId ?? null, applicationIds: u.applications.map((item) => item.applicationId) }))} departments={departments} applications={applications}/>
    <div className="mt-6 overflow-hidden rounded-3xl border-2 border-teal-200 bg-white shadow-sm"><div className="border-b border-teal-100 bg-teal-50 px-5 py-5"><div className="flex items-center gap-2 text-base font-black text-slate-900"><ShieldCheck size={20} className="text-teal-600"/>Permission ของระบบจองห้องประชุม</div><p className="mt-1 text-sm text-slate-600">รายการนี้คือสิทธิ์จริงที่ใช้ควบคุมการอนุมัติ / ปฏิเสธ / ยกเลิกการจองห้องประชุม</p></div><div className="p-5">{meetingPermissions.some((p) => p.key === "APPROVE_MEETING_BOOKINGS") ? <div className="rounded-2xl border border-teal-200 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="text-lg font-black text-slate-900">อนุมัติและจัดการการจองห้องประชุม</div><div className="mt-2 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-xs font-black text-white">APPROVE_MEETING_BOOKINGS</div></div><div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">Role ที่ได้รับสิทธิ์: <span className="font-mono">MEETING_APPROVER</span></div></div><p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-6 text-slate-500">เมื่อกำหนดผู้ใช้เป็น <span className="font-mono font-bold text-teal-700">MEETING_APPROVER</span> ระบบจะผูก Permission <span className="font-mono font-bold text-teal-700">APPROVE_MEETING_BOOKINGS</span> ให้ และผู้ใช้นั้นจึงสามารถเข้าเมนูอนุมัติการจองห้องประชุมได้</p></div> : <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-5 text-sm text-red-700">ไม่พบ <span className="font-mono font-bold">APPROVE_MEETING_BOOKINGS</span> ในฐานข้อมูล</div>}</div></div>
  </section>;
}
