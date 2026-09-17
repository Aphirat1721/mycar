import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SystemAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = 25;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { createdAt: { gte: cutoff } }, take: pageSize, skip: (page - 1) * pageSize, orderBy: { createdAt: "desc" },
      include: { user: { select: { nameTh: true, firstnameTh: true, lastnameTh: true } } },
    }),
    prisma.auditLog.count({ where: { createdAt: { gte: cutoff } } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-teal-700">การจัดการระบบ</p><h1 className="mt-1 text-3xl font-black text-slate-900">ประวัติการใช้งาน</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบประวัติการใช้งานระบบย้อนหลัง 90 วันล่าสุด</p></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-4">วันเวลา</th><th className="px-5 py-4">ผู้ใช้งาน</th><th className="px-5 py-4">กิจกรรม</th><th className="px-5 py-4">รายการ</th><th className="px-5 py-4">ผลลัพธ์</th></tr></thead><tbody className="divide-y divide-slate-100">{logs.map((log) => { const actor = log.user?.nameTh ?? ([log.user?.firstnameTh, log.user?.lastnameTh].filter(Boolean).join(" ") || "System"); return <tr key={log.id}><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}</td><td className="px-5 py-4 font-semibold text-slate-700">{actor}</td><td className="px-5 py-4 font-semibold text-slate-700">{log.action}</td><td className="px-5 py-4 text-slate-500">{log.resource}{log.resourceId ? ` • ${log.resourceId.slice(0, 8)}…` : ""}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${log.result === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : log.result === "DENIED" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{log.result}</span></td></tr>; })}</tbody></table>{logs.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">ยังไม่มีประวัติการใช้งานใน 90 วันล่าสุด</div> : null}</div></div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">แสดง {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} จาก {total.toLocaleString()} รายการ</p>
        <nav className="flex items-center gap-1" aria-label="หน้าประวัติการใช้งาน">
          <Link href={`?page=${Math.max(1, page - 1)}`} aria-disabled={page <= 1} className={`rounded-lg px-3 py-2 text-sm font-semibold ${page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-100"}`}>ก่อนหน้า</Link>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const n = Math.min(Math.max(1, page - 2) + i, totalPages); return <Link key={n} href={`?page=${n}`} className={`grid size-9 place-items-center rounded-lg text-sm font-bold ${n === page ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{n}</Link>; })}
          <Link href={`?page=${Math.min(totalPages, page + 1)}`} aria-disabled={page >= totalPages} className={`rounded-lg px-3 py-2 text-sm font-semibold ${page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-slate-100"}`}>ถัดไป</Link>
        </nav>
      </div></div>;
}
