"use client";

import { useState } from "react";
import { Building2, Check, ChevronDown, ShieldCheck, UserRoundCog, X } from "lucide-react";

type User = {
  id: string;
  nameTh: string | null;
  firstnameTh: string | null;
  lastnameTh: string | null;
  organizationHcode: string | null;
  organizationName: string | null;
  status: "ACTIVE" | "INACTIVE";
  role: string;
  meetingRole: string;
  departmentId: string | null;
  applicationIds: string[];
};
type Department = { id: string; publicId: string; nameTh: string };
type Application = { id: string; publicId: string; code: string; nameTh: string };

export default function UsersManager({ initialUsers, departments, applications, canManageRoles }: { initialUsers: User[]; departments: Department[]; applications: Application[]; canManageRoles: boolean }) {
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState<string | null>(null);

  async function changeRole(id: string, role: string) {
    setSaving(id);
    const response = await fetch(`/mycar/api/v1/users/${id}/roles`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, application: "MYCAR" }) });
    setSaving(null);
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนสิทธิ์ระบบรถยนต์ได้");
    setUsers((items) => items.map((u) => u.id === id ? { ...u, role } : u));
  }

  async function changeMeetingRole(id: string, role: string) {
    setSaving(id);
    const response = await fetch(`/mycar/api/v1/users/${id}/roles`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, application: "MEETING_ROOMS" }) });
    setSaving(null);
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนสิทธิ์ห้องประชุมได้");
    setUsers((items) => items.map((u) => u.id === id ? { ...u, meetingRole: role } : u));
  }

  async function changeDepartment(id: string, departmentId: string) {
    setSaving(id);
    const response = await fetch(`/mycar/api/v1/users/${id}/department`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ departmentId: departmentId || null }) });
    setSaving(null);
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนแผนกได้");
    setUsers((items) => items.map((u) => u.id === id ? { ...u, departmentId: departmentId || null } : u));
  }

  async function changeApplications(id: string, applicationIds: string[]) {
    setSaving(id);
    const response = await fetch(`/mycar/api/v1/users/${id}/applications`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationIds }) });
    setSaving(null);
    if (!response.ok) return alert("ไม่สามารถเปลี่ยนสิทธิ์โมดูลได้");
    setUsers((items) => items.map((u) => u.id === id ? { ...u, applicationIds } : u));
  }

  return <div className="space-y-6">
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-900"><span className="font-black">สิทธิ์โมดูล</span> ใช้กำหนดว่า User แต่ละคนเข้าใช้ระบบใดได้บ้าง และสามารถกำหนดสิทธิ์ภายในแต่ละระบบแยกจากกันได้</div>
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-teal-600" />User Access Management</div></div>
      <div className="divide-y divide-slate-100">
        {users.map((u) => <div key={u.id} className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><UserRoundCog size={20} /></span>
          <div className="min-w-0 flex-1"><div className="font-bold text-slate-800">{u.nameTh ?? ([u.firstnameTh, u.lastnameTh].filter(Boolean).join(" ") || "ไม่ทราบชื่อ")}</div><div className="mt-1 text-xs text-slate-500">{u.organizationName || "หน่วยบริการ"} • {u.organizationHcode || "-"}</div></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Building2 size={15} />แผนก<select disabled={saving === u.id} value={u.departmentId ?? ""} onChange={(e) => changeDepartment(u.id, e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"><option value="">ไม่ระบุ</option>{departments.map((d) => <option key={d.publicId} value={d.publicId}>{d.nameTh}</option>)}</select></label>
            {canManageRoles ? <>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">สิทธิ์ระบบรถยนต์<select disabled={saving === u.id} value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-teal-500"><option value="USER">ผู้ใช้งาน</option><option value="ADMIN">ผู้ดูแลระบบ</option><option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด</option><option value="VEHICLE_APPROVER">ผู้อนุมัติการขอใช้รถ</option><option value="DRIVER_EVALUATION_REVIEWER">ผู้ดู/รับทราบการประเมิน</option></select></label>
              <label className="flex items-start gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15} className="mt-2 shrink-0 text-teal-600" /><span><span className="mb-1 block">สิทธิ์ระบบห้องประชุม</span><select disabled={saving === u.id} value={u.meetingRole} onChange={(e) => changeMeetingRole(u.id, e.target.value)} className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-teal-500"><option value="USER">ผู้ใช้งาน</option><option value="MEETING_APPROVER">ผู้อนุมัติการจอง</option></select>{u.meetingRole === "MEETING_APPROVER" ? <span className="mt-1 block font-mono text-[10px] font-bold text-teal-700">MEETING_APPROVER → APPROVE_MEETING_BOOKINGS</span> : null}</span></label>
            </> : null}
            <ApplicationPicker user={u} applications={applications} disabled={saving === u.id} onSave={changeApplications} />
          </div>
        </div>)}
      </div>
    </div>
  </div>;
}

function ApplicationPicker({ user, applications, disabled, onSave }: { user: User; applications: Application[]; disabled: boolean; onSave: (id: string, applicationIds: string[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(user.applicationIds);
  const hasChanges = selected.length !== user.applicationIds.length || selected.some((id) => !user.applicationIds.includes(id));
  return <div className="relative">
    <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className="flex min-w-60 items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-left text-sm font-semibold text-teal-800 hover:border-teal-400 disabled:opacity-50"><span>โมดูลที่เข้าใช้ได้ ({selected.length})</span><ChevronDown size={16} /></button>
    {open ? <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">กำหนดโมดูลให้ User</div><div className="space-y-1">{applications.map((app) => { const checked = selected.includes(app.id); return <button key={app.id} type="button" onClick={() => setSelected((items) => checked ? items.filter((id) => id !== app.id) : [...items, app.id])} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"><span><span className="font-semibold text-slate-700">{app.nameTh}</span><span className="ml-2 text-xs text-slate-400">{app.code}</span></span>{checked ? <Check size={16} className="text-teal-600" /> : <X size={16} className="text-slate-200" />}</button>; })}</div><div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => { setSelected(user.applicationIds); setOpen(false); }} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500">ยกเลิก</button><button type="button" disabled={!hasChanges || disabled} onClick={async () => { await onSave(user.id, selected); setOpen(false); }} className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">บันทึก</button></div></div> : null}
  </div>;
}
