"use client";

import Image from "next/image";
import Swal from "sweetalert2";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserRound, X, Link2 } from "lucide-react";

type Driver = { id: string; firstName: string; lastName: string; nickname: string | null; photoPath: string | null; status: "ACTIVE" | "INACTIVE"; user: { publicId: string; nameTh: string | null; firstnameTh: string | null; lastnameTh: string | null } | null };
type Candidate = { publicId: string; nameTh: string | null; firstnameTh: string | null; lastnameTh: string | null; driver: { publicId: string; firstName: string; lastName: string } | null };
type Form = { firstName: string; lastName: string; nickname: string; userId: string; status: "ACTIVE" | "INACTIVE" };
const emptyForm: Form = { firstName: "", lastName: "", nickname: "", userId: "", status: "ACTIVE" };
function userName(u: Candidate | Driver["user"] | null) { return u?.nameTh || [u?.firstnameTh, u?.lastnameTh].filter(Boolean).join(" ") || "ไม่ทราบชื่อ"; }

export default function DriversManager({ initialDrivers, users }: { initialDrivers: Driver[]; users: Candidate[] }) {
  const [drivers, setDrivers] = useState(initialDrivers);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);

  const filtered = useMemo(() => drivers.filter((d) => `${d.firstName} ${d.lastName} ${d.nickname ?? ""} ${userName(d.user)}`.toLowerCase().includes(query.toLowerCase())), [drivers, query]);
  const availableUsers = users.filter((u) => !u.driver || u.driver.publicId === editing?.id);

  function openCreate() { setEditing(null); setForm(emptyForm); setPhoto(null); setOpen(true); }
  function openEdit(driver: Driver) { setEditing(driver); setForm({ firstName: driver.firstName, lastName: driver.lastName, nickname: driver.nickname ?? "", userId: driver.user?.publicId ?? "", status: driver.status }); setPhoto(null); setOpen(true); }

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) return alert("กรุณากรอกชื่อและนามสกุล");
    if (!form.userId) return alert("กรุณาเลือกบัญชีผู้ใช้สำหรับการเข้าใช้งานของ พขร.");
    setSaving(true);
    const url = editing ? `/mycar/api/v1/drivers/${editing.id}` : "/mycar/api/v1/drivers";
    const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setSaving(false); return alert(payload.error ?? "ไม่สามารถบันทึกข้อมูลได้"); }
    let driver = payload.data as Driver;
    if (photo) {
      const upload = new FormData(); upload.set("photo", photo);
      const photoResponse = await fetch(`/mycar/api/v1/drivers/${driver.id}/photo`, { method: "POST", body: upload });
      const photoPayload = await photoResponse.json().catch(() => ({}));
      if (!photoResponse.ok) { setSaving(false); return alert("บันทึกข้อมูลแล้ว แต่ไม่สามารถอัปโหลดรูปได้"); }
      driver = { ...driver, photoPath: photoPayload.photoPath };
    }
    setDrivers((items) => editing ? items.map((item) => item.id === driver.id ? driver : item) : [driver, ...items]);
    setSaving(false); setOpen(false); setEditing(null); setPhoto(null); setForm(emptyForm);
  }
  async function toggle(driver: Driver) { const status = driver.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"; const response = await fetch(`/mycar/api/v1/drivers/${driver.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) return alert("ไม่สามารถเปลี่ยนสถานะได้"); setDrivers((items) => items.map((item) => item.id === driver.id ? { ...item, status } : item)); }
  async function remove(driver: Driver) { const result = await Swal.fire({ icon: "warning", title: "ยืนยันการลบข้อมูล?", text: `${driver.firstName} ${driver.lastName}`, showCancelButton: true, confirmButtonText: "ยืนยันลบ", cancelButtonText: "ยกเลิก", reverseButtons: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#64748b" });
    if (!result.isConfirmed) return; setDeleting(driver.id); const response = await fetch(`/mycar/api/v1/drivers/${driver.id}`, { method: "DELETE" }); setDeleting(null); if (!response.ok) return alert("ไม่สามารถลบข้อมูลได้"); setDrivers((items) => items.filter((item) => item.id !== driver.id)); }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-teal-700">ข้อมูลพื้นฐาน</p><h1 className="mt-1 text-3xl font-black text-slate-900">พนักงานขับรถ</h1><p className="mt-2 text-sm text-slate-500">จัดการข้อมูล พขร. และผูกบัญชีผู้ใช้สำหรับบันทึกการใช้รถ</p></div><button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"><Plus size={18} />เพิ่มพนักงานขับรถ</button></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อ พขร. หรือบัญชีผู้ใช้" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></div></div>
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-4">พนักงาน</th><th className="px-5 py-4">บัญชีเข้าใช้งาน</th><th className="px-5 py-4">ชื่อเล่น</th><th className="px-5 py-4">สถานะ</th><th className="px-5 py-4 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((driver) => <tr key={driver.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center overflow-hidden rounded-xl bg-teal-50 text-teal-700">{driver.photoPath ? <Image src={driver.photoPath} alt="" width={44} height={44} className="size-full object-cover" unoptimized /> : <UserRound size={18} />}</span><div><div className="font-bold text-slate-800">{driver.firstName} {driver.lastName}</div><div className="text-xs text-slate-400">รหัส: {driver.id.slice(0, 8)}…</div></div></div></td><td className="px-5 py-4">{driver.user ? <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700"><Link2 size={13} />{userName(driver.user)}</span> : <span className="text-xs text-rose-600">ยังไม่ผูกบัญชี</span>}</td><td className="px-5 py-4 text-slate-600">{driver.nickname || "—"}</td><td className="px-5 py-4"><button onClick={() => toggle(driver)} className={`rounded-full px-3 py-1 text-xs font-bold ${driver.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{driver.status === "ACTIVE" ? "ใช้งาน" : "ไม่ใช้งาน"}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(driver)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={14} />แก้ไข</button><button disabled={deleting === driver.id} onClick={() => remove(driver)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} />ลบ</button></div></td></tr>)}</tbody></table>{filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">ยังไม่มีข้อมูลพนักงานขับรถ</div> : null}</div></div>
    {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">{editing ? "แก้ไขพนักงานขับรถ" : "เพิ่มพนักงานขับรถ"}</h2><p className="mt-1 text-sm text-slate-500">ผูกกับบัญชีที่ Login ด้วย Provider ID เพื่อให้ พขร. เห็นงานของตัวเอง</p></div><button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="ชื่อ" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} /><Field label="นามสกุล" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} /><Field label="ชื่อเล่น" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} /><label className="text-sm font-semibold text-slate-700">บัญชีผู้ใช้<select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"><option value="">เลือกผู้ใช้</option>{availableUsers.map((u) => <option key={u.publicId} value={u.publicId}>{userName(u)}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-400">ระบบจะเพิ่มสิทธิ์ “พนักงานขับรถ” ให้บัญชีนี้อัตโนมัติ</span></label><label className="text-sm font-semibold text-slate-700">สถานะ<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none"><option value="ACTIVE">ใช้งาน</option><option value="INACTIVE">ไม่ใช้งาน</option></select></label></div><label className="mt-4 block text-sm font-semibold text-slate-700">รูปถ่าย<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-3 text-sm font-normal" /><span className="mt-1 block text-xs font-normal text-slate-400">JPG, PNG หรือ WebP ไม่เกิน 5 MB{editing ? " • หากไม่เลือกไฟล์ จะใช้รูปเดิม" : ""}</span></label><button disabled={saving} onClick={save} className="mt-6 w-full rounded-xl bg-slate-950 py-3 font-bold text-white disabled:opacity-50">{saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button></div></div> : null}
  </div>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-semibold text-slate-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></label>; }
