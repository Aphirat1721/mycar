"use client";

import { useMemo, useState } from "react";
import { CarFront, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";

type Vehicle = { id: string; licensePlate: string | null; brand: string | null; model: string | null; color: string | null; vehicleType: string | null; note: string | null; status: "ACTIVE" | "INACTIVE" };
type Form = { licensePlate: string; brand: string; model: string; color: string; vehicleType: string; note: string; status: "ACTIVE" | "INACTIVE" };
const emptyForm: Form = { licensePlate: "", brand: "", model: "", color: "", vehicleType: "", note: "", status: "ACTIVE" };

export default function VehiclesManager({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const filtered = useMemo(() => vehicles.filter((v) => `${v.licensePlate ?? ""} ${v.brand ?? ""} ${v.model ?? ""} ${v.vehicleType ?? ""}`.toLowerCase().includes(query.toLowerCase())), [vehicles, query]);

  function openCreate() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(vehicle: Vehicle) { setEditing(vehicle); setForm({ licensePlate: vehicle.licensePlate ?? "", brand: vehicle.brand ?? "", model: vehicle.model ?? "", color: vehicle.color ?? "", vehicleType: vehicle.vehicleType ?? "", note: vehicle.note ?? "", status: vehicle.status }); setOpen(true); }

  async function save() {
    setSaving(true);
    const url = editing ? `/mycar/api/v1/vehicles/${editing.id}` : "/mycar/api/v1/vehicles";
    const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return alert(payload.error ?? "ไม่สามารถบันทึกข้อมูลได้");
    setVehicles((items) => editing ? items.map((item) => item.id === editing.id ? payload.data : item) : [payload.data, ...items]);
    setForm(emptyForm); setEditing(null); setOpen(false);
  }

  async function toggle(vehicle: Vehicle) {
    const status = vehicle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const response = await fetch(`/mycar/api/v1/vehicles/${vehicle.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนสถานะได้");
    setVehicles((items) => items.map((item) => item.id === vehicle.id ? { ...item, status } : item));
  }

  async function remove(vehicle: Vehicle) {
    const result = await Swal.fire({ icon: "warning", title: "ยืนยันการลบข้อมูลรถ?", text: vehicle.licensePlate || "คันนี้", showCancelButton: true, confirmButtonText: "ยืนยันลบ", cancelButtonText: "ยกเลิก", reverseButtons: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#64748b" });
    if (!result.isConfirmed) return;
    setDeleting(vehicle.id);
    const response = await fetch(`/mycar/api/v1/vehicles/${vehicle.id}`, { method: "DELETE" });
    setDeleting(null);
    if (!response.ok) return alert("ไม่สามารถลบข้อมูลได้");
    setVehicles((items) => items.filter((item) => item.id !== vehicle.id));
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-teal-700">ข้อมูลพื้นฐาน</p><h1 className="mt-1 text-3xl font-black text-slate-900">ข้อมูลรถ</h1><p className="mt-2 text-sm text-slate-500">จัดการทะเบียน รายละเอียดรถ และสถานะการใช้งาน</p></div><button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"><Plus size={18} />เพิ่มรถยนต์</button></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาทะเบียน ยี่ห้อ รุ่น หรือประเภทรถ" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></div></div>
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-4">รถยนต์</th><th className="px-5 py-4">ประเภท</th><th className="px-5 py-4">สี</th><th className="px-5 py-4">สถานะ</th><th className="px-5 py-4 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((v) => <tr key={v.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><CarFront size={18} /></span><div><div className="font-bold text-slate-800">{v.licensePlate || "ยังไม่ระบุทะเบียน"}</div><div className="text-xs text-slate-400">{[v.brand, v.model].filter(Boolean).join(" • ") || "ยังไม่ระบุยี่ห้อ/รุ่น"}</div></div></div></td><td className="px-5 py-4 text-slate-600">{v.vehicleType || "—"}</td><td className="px-5 py-4 text-slate-600">{v.color || "—"}</td><td className="px-5 py-4"><button onClick={() => toggle(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${v.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{v.status === "ACTIVE" ? "ใช้งาน" : "ไม่ใช้งาน"}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(v)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={14} />แก้ไข</button><button disabled={deleting === v.id} onClick={() => remove(v)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} />ลบ</button></div></td></tr>)}</tbody></table>{filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">ยังไม่มีข้อมูลรถยนต์</div> : null}</div></div>
    {open ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">{editing ? "แก้ไขข้อมูลรถ" : "เพิ่มรถยนต์"}</h2><p className="mt-1 text-sm text-slate-500">โครงสร้างรองรับการเพิ่มรายละเอียดรถในอนาคต</p></div><button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-xl hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="ทะเบียน" value={form.licensePlate} onChange={(v) => setForm({ ...form, licensePlate: v })} /><Field label="ยี่ห้อ" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} /><Field label="รุ่น" value={form.model} onChange={(v) => setForm({ ...form, model: v })} /><Field label="สี" value={form.color} onChange={(v) => setForm({ ...form, color: v })} /><Field label="ประเภทรถ" value={form.vehicleType} onChange={(v) => setForm({ ...form, vehicleType: v })} /><label className="text-sm font-semibold text-slate-700">สถานะ<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none"><option value="ACTIVE">ใช้งาน</option><option value="INACTIVE">ไม่ใช้งาน</option></select></label></div><label className="mt-4 block text-sm font-semibold text-slate-700">หมายเหตุ<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></label><button disabled={saving} onClick={save} className="mt-6 w-full rounded-xl bg-slate-950 py-3 font-bold text-white disabled:opacity-50">{saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button></div></div> : null}
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="text-sm font-semibold text-slate-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></label>; }
