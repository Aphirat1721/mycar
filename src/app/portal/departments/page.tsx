import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { hasApplicationAccess } from "@/modules/portal/applications";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DepartmentsManager from "@/components/departments-manager";
export default async function DepartmentsPage(){const user=await requireAdmin();if(!(await hasApplicationAccess(user.id,"DEPARTMENTS")))redirect("/portal");const departments=await prisma.department.findMany({where:{deletedAt:null},orderBy:[{status:"asc"},{nameTh:"asc"}],include:{_count:{select:{users:true}}}});return <section className="mx-auto max-w-7xl"><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold tracking-[0.14em] text-teal-700">SYSTEM SETTINGS / DEPARTMENTS</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">จัดการแผนก</h1><p className="mt-2 text-sm leading-6 text-slate-500">จัดการชื่อแผนก ตัวย่อ รหัสภายใน และสถานะการใช้งานของหน่วยงาน</p></div><Link href="/portal" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"><ArrowLeft size={17}/>กลับหน้า Portal</Link></div><DepartmentsManager initialDepartments={departments.map(d=>({id:d.publicId,code:d.code,abbreviation:d.abbreviation,nameTh:d.nameTh,status:d.status,userCount:d._count.users}))}/></section>}
