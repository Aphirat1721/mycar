"use client";

import { FormEvent, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, Power, Search, Trash2, Users, X } from "lucide-react";

type Department = { id: string; code: string; nameTh: string; abbreviation: string | null; status: "ACTIVE" | "INACTIVE"; userCount: number };
type Props = { initialDepartments: Department[] };
const PAGE_SIZE = 10;

export default function DepartmentsManager({ initialDepartments }: Props) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [editing, setEditing] = useState<Department | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", nameTh: "", abbreviation: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => ({
    total: departments.length,
    active: departments.filter((d) => d.status === "ACTIVE").length,
    inactive: departments.filter((d) => d.status === "INACTIVE").length,
    users: departments.reduce((sum, d) => sum + d.userCount, 0),
  }), [departments]);

  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return departments;
    return departments.filter((d) => d.code.toLowerCase().includes(keyword) || d.nameTh.toLowerCase().includes(keyword) || (d.abbreviation ?? "").toLowerCase().includes(keyword));
  }, [departments, search]);
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleDepartments = filteredDepartments.slice(pageStart, pageStart + PAGE_SIZE);

  function openCreate() { setEditing(null); setForm({ code: "", nameTh: "", abbreviation: "" }); setShowForm(true); }
  function openEdit(d: Department) { setEditing(d); setForm({ code: d.code, nameTh: d.nameTh, abbreviation: d.abbreviation ?? "" }); setShowForm(true); }
  function closeForm() { setEditing(null); setForm({ code: "", nameTh: "", abbreviation: "" }); setShowForm(false); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = form.code.trim().toUpperCase();
    const nameTh = form.nameTh.trim();
    const abbreviation = form.abbreviation.trim().toUpperCase() || null;
    if (!code || !nameTh) return alert("กรุณาระบุรหัสและชื่อแผนก");
    setSaving(true);
    try {
      const response = await fetch(editing ? `/mycar/api/v1/departments/${editing.id}` : "/mycar/api/v1/departments", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, nameTh, abbreviation }) });
      const payload = await response.json();
      if (!response.ok) return alert(payload.error ?? "ไม่สามารถบันทึกข้อมูลได้");
      const row = { ...payload.data, id: payload.data.publicId, userCount: editing?.userCount ?? 0 } as Department;
      setDepartments((items) => editing ? items.map((item) => item.id === editing.id ? row : item) : [...items, row]);
      setPage(1); closeForm();
    } catch { alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"); } finally { setSaving(false); }
  }

  async function toggle(d: Department) {
    const response = await fetch(`/mycar/api/v1/departments/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) });
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนสถานะได้");
    const payload = await response.json();
    setDepartments((items) => items.map((item) => item.id === d.id ? { ...item, status: payload.data.status } : item));
  }

  async function remove(d: Department) {
    if (d.userCount > 0) return alert("ไม่สามารถลบแผนกที่มีผู้ใช้งานอยู่ได้ กรุณาย้ายผู้ใช้งานก่อน");
    const result = await Swal.fire({ icon: "warning", title: "ยืนยันการลบแผนก?", text: d.nameTh, showCancelButton: true, confirmButtonText: "ยืนยันลบ", cancelButtonText: "ยกเลิก", reverseButtons: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#64748b" });
    if (!result.isConfirmed) return;
    const response = await fetch(`/mycar/api/v1/departments/${d.id}`, { method: "DELETE" });
    if (!response.ok) return alert("ไม่สามารถลบแผนกได้");
    setDepartments((items) => items.filter((item) => item.id !== d.id));
    if (page > 1 && visibleDepartments.length === 1) setPage(page - 1);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Building2 size={19}/>} label="แผนกทั้งหมด" value={stats.total} tone="blue" />
        <Stat icon={<CheckCircle2 size={19}/>} label="เปิดใช้งาน" value={stats.active} tone="emerald" />
        <Stat icon={<Power size={19}/>} label="ปิดใช้งาน" value={stats.inactive} tone="slate" />
        <Stat icon={<Users size={19}/>} label="ผู้ใช้งานที่สังกัดแผนก" value={stats.users} tone="violet" />
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Building2 size={18}/></span><h2 className="text-lg font-black text-slate-900">รายการแผนก</h2></div>
              <p className="mt-1 pl-11 text-xs text-slate-500">ชื่อแผนกและตัวย่อจะแสดงในส่วนที่เกี่ยวข้องกับข้อมูลหน่วยงาน</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-72"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ค้นหาชื่อแผนก / ตัวย่อ / รหัส" aria-label="ค้นหาแผนก" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"/></div>
              <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"><Plus size={18}/>เพิ่มแผนก</button>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-500"><tr><th className="px-6 py-3.5">แผนก</th><th className="px-4 py-3.5">รหัสระบบ</th><th className="px-4 py-3.5">ผู้ใช้งาน</th><th className="px-4 py-3.5">สถานะ</th><th className="px-6 py-3.5 text-right">จัดการ</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{visibleDepartments.map((d) => <tr key={d.id} className="transition hover:bg-slate-50/60"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 font-black text-teal-700">{(d.abbreviation || "แผนก").slice(0, 3)}</span><div className="min-w-0"><div className="font-bold text-slate-800">{d.nameTh}</div><div className="mt-0.5 text-xs text-slate-500">ตัวย่อ <span className="font-bold text-slate-600">{d.abbreviation || "-"}</span></div></div></div></td><td className="px-4 py-4 font-mono text-xs font-semibold text-slate-500">{d.code}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 font-semibold text-slate-600"><Users size={15} className="text-slate-400"/>{d.userCount} คน</span></td><td className="px-4 py-4"><StatusBadge status={d.status}/></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><ActionButton title="แก้ไข" onClick={() => openEdit(d)}><Pencil size={16}/></ActionButton><ActionButton title={d.status === "ACTIVE" ? "ปิดใช้งาน" : "เปิดใช้งาน"} onClick={() => toggle(d)}><Power size={16}/></ActionButton><ActionButton title="ลบ" danger onClick={() => remove(d)}><Trash2 size={16}/></ActionButton></div></td></tr>)}</tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">{visibleDepartments.map((d) => <div key={d.id} className="p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-black text-teal-700">{(d.abbreviation || "แผนก").slice(0, 3)}</span><div className="min-w-0 flex-1"><div className="font-bold text-slate-800">{d.nameTh}</div><div className="mt-1 text-xs text-slate-500">{d.abbreviation || "ไม่มีตัวย่อ"} · {d.code} · {d.userCount} คน</div><div className="mt-2"><StatusBadge status={d.status}/></div></div><div className="flex gap-1"><ActionButton title="แก้ไข" onClick={() => openEdit(d)}><Pencil size={15}/></ActionButton><ActionButton title="เปลี่ยนสถานะ" onClick={() => toggle(d)}><Power size={15}/></ActionButton></div></div></div>)}{visibleDepartments.length === 0 ? <EmptyState search={search}/>:null}</div>
        {visibleDepartments.length === 0 && <div className="hidden md:block"><EmptyState search={search}/></div>}

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{filteredDepartments.length === 0 ? "แสดง 0 รายการ" : `แสดง ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filteredDepartments.length)} จาก ${filteredDepartments.length} รายการ`}</span>
          <div className="flex items-center gap-1.5"><button type="button" disabled={currentPage === 1} onClick={() => setPage((v) => Math.max(1, v - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 disabled:opacity-40"><ChevronLeft size={14}/>ก่อนหน้า</button><span className="min-w-20 text-center font-semibold text-slate-600">หน้า {currentPage} / {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((v) => Math.min(totalPages, v + 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 disabled:opacity-40">ถัดไป<ChevronRight size={14}/></button></div>
        </div>
      </div>

      {showForm ? <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-[2px]"><form onSubmit={save} className="w-full max-w-2xl rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold tracking-[0.14em] text-teal-700">DEPARTMENT</p><h3 className="mt-1 text-xl font-black text-slate-900">{editing ? "แก้ไขข้อมูลแผนก" : "เพิ่มแผนกใหม่"}</h3></div><button type="button" onClick={closeForm} className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด"><X size={19}/></button></div><div className="grid gap-5 px-6 py-6 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">รหัสระบบ<input autoFocus value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} placeholder="เช่น D01" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"/><span className="mt-1.5 block text-xs font-normal text-slate-400">ใช้เป็นรหัสภายในระบบ</span></label><label className="text-sm font-bold text-slate-700">ชื่อแผนก<input value={form.nameTh} onChange={(e) => setForm((c) => ({ ...c, nameTh: e.target.value }))} placeholder="เช่น แผนกผู้ป่วยนอก" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"/></label><label className="text-sm font-bold text-slate-700 md:col-span-2">ตัวย่อ<input value={form.abbreviation} onChange={(e) => setForm((c) => ({ ...c, abbreviation: e.target.value }))} placeholder="เช่น OPD" maxLength={30} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"/><span className="mt-1.5 block text-xs font-normal text-slate-400">ใช้แสดงคู่กับชื่อแผนก เช่น OPD, ER, ICU</span></label></div><div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">ยกเลิก</button><button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50">{saving ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มแผนก"}</button></div></form></div>:null}
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "emerald" | "slate" | "violet" }) { const tones = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-600", violet: "bg-violet-50 text-violet-700" }; return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">{value.toLocaleString("th-TH")}</p></div></div></div>; }
function StatusBadge({ status }: { status: Department["status"] }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{status === "ACTIVE" ? "ใช้งาน" : "ปิดใช้งาน"}</span>; }
function ActionButton({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) { return <button type="button" onClick={onClick} title={title} aria-label={title} className={`grid size-9 place-items-center rounded-lg transition ${danger ? "text-rose-500 hover:bg-rose-50" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>{children}</button>; }
function EmptyState({ search }: { search: string }) { return <div className="p-12 text-center text-sm text-slate-500">{search ? "ไม่พบแผนกที่ค้นหา" : "ยังไม่มีข้อมูลแผนก"}</div>; }
