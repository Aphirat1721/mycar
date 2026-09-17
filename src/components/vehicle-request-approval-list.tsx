"use client";

import Link from "next/link";
import { useState } from "react";
import DatePicker from "@/components/date-picker";
import { Check, Pencil, RotateCcw, XCircle, AlertTriangle, Info as InfoIcon } from "lucide-react";

type Option = { id: string; label: string };
type RequestItem = {
  publicId: string; departureDate: string | Date; departureTime: string | Date; returnDate: string | Date; returnTime: string | Date;
  destination: string; purpose: string; passengerCount: number; passengerNames?: string | null; note?: string | null; status: string;
  requester: { nameTh?: string | null; firstnameTh?: string | null; lastnameTh?: string | null };
  department?: { nameTh?: string | null } | null;
  vehicle?: { licensePlate: string | null; brand: string | null; model: string | null } | null;
  driver?: { firstName: string; lastName: string; nickname: string | null } | null;
  usageLog?: { lockedAt: string | Date | null; actualDepartureAt: string | Date | null; actualReturnAt: string | Date | null; odometerStart: number | string | null; odometerEnd: number | string | null } | null;
};
type AlertState = { type: "error" | "success"; title: string; message: string } | null;

export default function VehicleRequestApprovalList({ initialRequests, vehiclesByRequest, driversByRequest }: { initialRequests: RequestItem[]; vehiclesByRequest: Record<string, Option[]>; driversByRequest: Record<string, Option[]> }) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(initialRequests[0]?.departureDate ?? new Date()));
  const [searchDateText, setSearchDateText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState<RequestItem | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmUnapprove, setConfirmUnapprove] = useState<RequestItem | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<RequestItem | null>(null);

  const days = Array.from({ length: 16 }, (_, i) => addDays(new Date(), i));
  const selectedRequests = requests.filter(item => dateKey(item.departureDate) === selectedDate);
  const countForDay = (date: Date, status: string) => requests.filter(item => dateKey(item.departureDate) === dateKey(date) && item.status === status).length;

  function openApproval(item: RequestItem) { setAssigning(item); setVehicleId(""); setDriverId(""); }
  function closeApproval() { if (!busy) setAssigning(null); }
  function showError(message: string, title = "ไม่สามารถดำเนินการได้") { setAlert({ type: "error", title, message }); }

  async function decide(id: string, action: "APPROVE" | "REJECT" | "CANCEL" | "UNAPPROVE", assignedVehicleId?: string, assignedDriverId?: string) {
    if (action === "REJECT" && !reason[id]?.trim()) return showError("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "กรุณาระบุเหตุผล");
    if (action === "APPROVE" && (!assignedVehicleId || !assignedDriverId)) return showError("กรุณาเลือกรถและพนักงานขับรถก่อนอนุมัติ", "ข้อมูลไม่ครบ");
    setBusy(id);
    try {
      const res = await fetch(`/mycar/api/v1/vehicle-requests/${id}/approval`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason: reason[id] || "", vehicleId: assignedVehicleId, driverId: assignedDriverId }) });
      const data = await res.json();
      if (!res.ok) { showError(data.error || "ไม่สามารถดำเนินการได้"); return; }
      if (action === "UNAPPROVE") {
        setRequests(items => items.map(item => item.publicId === id ? { ...item, status: "PENDING", vehicle: null, driver: null } : item));
        setAlert({ type: "success", title: "ยกเลิกการอนุมัติแล้ว", message: "คำขอถูกเปลี่ยนกลับเป็นรอพิจารณา และคืนรถกับพนักงานขับรถให้ว่างแล้ว" });
      } else if (action === "APPROVE") {
        setRequests(items => items.map(item => item.publicId === id ? { ...item, status: "APPROVED" } : item));
        setAlert({ type: "success", title: "อนุมัติคำขอเรียบร้อย", message: "ระบบบันทึกการจัดสรรรถและพนักงานขับรถแล้ว" });
      } else if (action === "CANCEL") {
        setRequests(items => items.map(item => item.publicId === id ? { ...item, status: "CANCELLED", vehicle: null, driver: null } : item));
        setAlert({ type: "success", title: "ยกเลิกคำขอเรียบร้อย", message: "คำขอถูกเปลี่ยนเป็นสถานะยกเลิกแล้ว" });
      } else {
        setRequests(items => items.map(item => item.publicId === id ? { ...item, status: "REJECTED" } : item));
        setAlert({ type: "success", title: "บันทึกผลเรียบร้อย", message: "คำขอถูกเปลี่ยนเป็นไม่อนุมัติแล้ว" });
      }
      setAssigning(null); setConfirmUnapprove(null); setConfirmCancel(null);
    } catch { showError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง"); }
    finally { setBusy(null); }
  }

  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4"><h2 className="font-black text-slate-800">รายการขอใช้รถ</h2><p className="mt-1 text-xs text-slate-500">เลือกวันที่จากตารางด้านขวา หรือค้นหาวันที่ที่ต้องการเพื่อดูรายการ</p></div>
    <div className="border-b border-slate-100 px-5 py-4"><div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-bold text-slate-600">ค้นหาวันที่<div className="relative mt-1"><DatePicker value={toInputDate(toInputDate(searchDateText))} onChange={v=>{setSearchDateText(v);}}/><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-600">{searchDateText || "วัน / เดือน / ปี"}</span></div></label><div className="flex gap-2"><button type="button" onClick={() => { setSearchDateText(""); }} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600">ล้าง</button></div></div><p className="mt-2 text-xs text-slate-400">ใช้เลือกวันที่ย้อนหลังได้ แม้วันที่นั้นอยู่นอกช่วง 16 วันด้านขวา</p></div>
    <div className="grid items-start lg:grid-cols-[minmax(0,1fr)_minmax(500px,1.15fr)]">
      <div className="min-w-0 lg:border-r border-slate-100">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-black text-slate-900">รายการวันที่ {formatDateKey(selectedDate)}</h3><p className="mt-1 text-xs text-slate-500">{selectedRequests.length} รายการ</p></div>
        {selectedRequests.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">ไม่มีรายการขอใช้รถในวันที่เลือก</div> : <div className="divide-y divide-slate-100">{selectedRequests.map(item => <div key={item.publicId} className="px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-900">{item.destination}</span><Status status={item.status}/></div><p className="mt-1 text-xs text-slate-500">{formatDate(item.departureDate)} {formatTime(item.departureTime)} → {formatDate(item.returnDate)} {formatTime(item.returnTime)}</p><p className="mt-1 text-xs text-slate-500">ผู้ขอ: {requesterName(item)} • {item.department?.nameTh || "ไม่ระบุแผนก"}</p></div>
          <div className="flex flex-wrap gap-2">{item.status === "PENDING" ? <><button type="button" disabled={busy === item.publicId} onClick={() => openApproval(item)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14} className="mr-1 inline"/>อนุมัติ</button><button type="button" disabled={busy === item.publicId} onClick={() => decide(item.publicId,"REJECT")} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">ไม่อนุมัติ</button><button type="button" disabled={busy === item.publicId} onClick={() => setConfirmCancel(item)} className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-50"><XCircle size={14} className="mr-1 inline"/>ยกเลิก</button></> : null}{item.status === "APPROVED" ? <><Link href={`/dashboard/vehicle-requests?edit=${item.publicId}`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"><Pencil size={14} className="mr-1 inline"/>แก้ไข</Link><button type="button" disabled={busy === item.publicId} onClick={() => setConfirmUnapprove(item)} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><RotateCcw size={14} className="mr-1 inline"/>ยกเลิกการอนุมัติ</button></> : null}</div></div>
          <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-2"><Info label="วัตถุประสงค์" value={item.purpose}/><Info label="ผู้โดยสาร" value={`${item.passengerCount} คน`}/><Info label="รถ" value={vehicleText(item)}/><Info label="พนักงานขับรถ" value={driverText(item)}/><div><p className="text-[10px] font-bold text-slate-400">บันทึก พขร.</p><UsageLogStatus item={item}/></div></div>
          {item.passengerNames ? <p className="mt-3 text-xs text-slate-500"><b>ผู้ร่วมเดินทาง:</b> {item.passengerNames}</p> : null}{item.note ? <p className="mt-1 text-xs text-slate-500"><b>หมายเหตุ:</b> {item.note}</p> : null}{item.status === "PENDING" ? <input value={reason[item.publicId] || ""} onChange={e => setReason(v => ({ ...v, [item.publicId]: e.target.value }))} placeholder="เหตุผล (จำเป็นเมื่อไม่อนุมัติ)" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"/> : null}
        </div>)}</div>}
      </div>
      <aside className="bg-slate-50/60 p-3 sm:p-4"><div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-3 py-4"><h3 className="font-black text-slate-900">สรุปคำขอใช้รถรายวัน</h3><p className="mt-1 text-xs text-slate-500">เริ่มวันนี้ นับไปอีก 15 วัน</p></div><div className="overflow-hidden"><table className="w-full min-w-0 table-fixed text-sm"><colgroup><col className="w-[58px]"/><col className="w-[70px]"/><col className="w-[60px]"/><col className="w-[60px]"/><col className="w-[60px]"/><col className="w-[60px]"/></colgroup><thead className="bg-slate-50 text-[10px] font-bold text-slate-500"><tr><th className="px-1.5 py-3 text-left">เดือน/พ.ศ.</th><th className="px-1.5 py-3 text-left">วันที่ / วัน</th><th className="px-0.5 py-3 text-center leading-4 text-amber-700">รอ<br/>พิจารณา</th><th className="px-0.5 py-3 text-center leading-4 text-emerald-700">อนุมัติ</th><th className="px-0.5 py-3 text-center leading-4 text-rose-700">ไม่<br/>อนุมัติ</th><th className="px-0.5 py-3 text-center leading-4 text-slate-600">ยกเลิก</th></tr></thead><tbody className="divide-y divide-slate-100">{days.map(day => { const key = dateKey(day); return <tr key={key} className={selectedDate === key ? "bg-teal-50" : "hover:bg-slate-50"}><td className="px-1.5 py-2 align-middle text-center text-[10px] font-semibold leading-4 text-slate-500"><span className="block">{formatMonth(day)}</span><span className="block">{formatYear(day)}</span></td><td className="px-1.5 py-2 align-middle"><button type="button" onClick={() => setSelectedDate(key)} className="text-left leading-4 hover:text-teal-700"><span className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-slate-800"><span>{formatDayNumber(day)}</span>{key === dateKey(new Date()) ? <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] text-teal-700">วันนี้</span> : null}</span><span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{formatWeekday(day)}</span></button></td><td className="px-0.5 py-2 text-center font-black text-amber-700">{countForDay(day,"PENDING")}</td><td className="px-0.5 py-2 text-center font-black text-emerald-700">{countForDay(day,"APPROVED")}</td><td className="px-0.5 py-2 text-center font-black text-rose-700">{countForDay(day,"REJECTED")}</td><td className="px-0.5 py-2 text-center font-black text-slate-600">{countForDay(day,"CANCELLED")}</td></tr>})}</tbody></table></div></div></aside>
    </div>
    {assigning ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={closeApproval}><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={e => e.stopPropagation()}><h3 className="text-xl font-black text-slate-900">กำหนดรถและพนักงานขับรถ</h3><p className="mt-1 text-sm text-slate-500">{assigning.destination} • {formatDate(assigning.departureDate)} {formatTime(assigning.departureTime)}–{formatTime(assigning.returnTime)} น.</p><div className="mt-5 grid gap-4"><label className="text-sm font-bold text-slate-700">รถที่ใช้<select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="input mt-2 w-full bg-white"><option value="">-- เลือกรถ --</option>{(vehiclesByRequest[assigning.publicId] ?? []).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-sm font-bold text-slate-700">พนักงานขับรถ<select value={driverId} onChange={e => setDriverId(e.target.value)} className="input mt-2 w-full bg-white"><option value="">-- เลือกพนักงานขับรถ --</option>{(driversByRequest[assigning.publicId] ?? []).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{(vehiclesByRequest[assigning.publicId] ?? []).length === 0 ? <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">ไม่มีรถว่างในช่วงวันและเวลานี้</div> : null}{(driversByRequest[assigning.publicId] ?? []).length === 0 ? <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">ไม่มีพนักงานขับรถว่างในช่วงวันและเวลานี้</div> : null}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeApproval} disabled={busy === assigning.publicId} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">ยกเลิก</button><button type="button" onClick={() => decide(assigning.publicId,"APPROVE",vehicleId,driverId)} disabled={busy === assigning.publicId} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === assigning.publicId ? "กำลังอนุมัติ..." : "ยืนยันอนุมัติ"}</button></div></div></div> : null}
    {confirmUnapprove ? <Modal title="ยกเลิกการอนุมัติ?" icon={<RotateCcw size={20}/>} message="ระบบจะเปลี่ยนสถานะกลับเป็นรอพิจารณา และคืนรถกับพนักงานขับรถให้ว่าง" onClose={() => setConfirmUnapprove(null)} onConfirm={() => decide(confirmUnapprove.publicId,"UNAPPROVE")} busy={busy === confirmUnapprove.publicId} confirmText="ยืนยัน"/> : null}
    {confirmCancel ? <Modal title="ยกเลิกคำขอใช้รถ?" icon={<XCircle size={20}/>} message="ระบบจะเปลี่ยนสถานะคำขอเป็นยกเลิก และคำขอนี้จะไม่สามารถอนุมัติหรือไม่อนุมัติได้อีก" onClose={() => setConfirmCancel(null)} onConfirm={() => decide(confirmCancel.publicId,"CANCEL")} busy={busy === confirmCancel.publicId} confirmText="ยืนยันยกเลิก" tone="error"/> : null}
    {alert ? <Modal title={alert.title} icon={alert.type === "error" ? <AlertTriangle size={20}/> : <InfoIcon size={20}/>} message={alert.message} onClose={() => setAlert(null)} confirmText="ตกลง" tone={alert.type}/> : null}
  </section>;
}
function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function dateKey(value: Date | string) { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function toInputDate(value: string) {
  const key = parseThaiDateInput(value);
  return key;
}

function parseThaiDateInput(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function formatDateKey(value: string) { const [y,m,d] = value.split("-").map(Number); return new Intl.DateTimeFormat("th-TH-u-ca-buddhist",{day:"2-digit",month:"long",year:"numeric",timeZone:"Asia/Bangkok"}).format(new Date(Date.UTC(y,m-1,d))); }
function formatMonth(value: Date) { return new Intl.DateTimeFormat("th-TH-u-ca-buddhist",{month:"short",timeZone:"Asia/Bangkok"}).format(value); }
function formatYear(value: Date) { return new Intl.DateTimeFormat("th-TH-u-ca-buddhist",{year:"numeric",timeZone:"Asia/Bangkok"}).format(value); }
function formatDayNumber(value: Date) { return new Intl.DateTimeFormat("th-TH-u-ca-buddhist",{day:"numeric",timeZone:"Asia/Bangkok"}).format(value); }
function formatWeekday(value: Date) { return new Intl.DateTimeFormat("th-TH",{weekday:"long",timeZone:"Asia/Bangkok"}).format(value); }
function formatDate(value: Date|string) { return new Intl.DateTimeFormat("th-TH-u-ca-buddhist",{day:"2-digit",month:"long",year:"numeric",timeZone:"Asia/Bangkok"}).format(new Date(value)); }
function formatTime(value: Date|string) { return new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"UTC"}).format(new Date(value)); }
function requesterName(item: RequestItem) { return item.requester.nameTh || [item.requester.firstnameTh,item.requester.lastnameTh].filter(Boolean).join(" ") || "ไม่ระบุ"; }
function vehicleText(item: RequestItem) { return item.vehicle ? [item.vehicle.licensePlate,item.vehicle.brand,item.vehicle.model].filter(Boolean).join(" • ") : "ยังไม่จัดรถ"; }
function driverText(item: RequestItem) { return item.driver ? `${item.driver.firstName} ${item.driver.lastName}${item.driver.nickname ? ` (${item.driver.nickname})` : ""}` : "ยังไม่จัดพนักงานขับรถ"; }
function Info({label,value}:{label:string;value:string}) { return <div><p className="text-[10px] font-bold text-slate-400">{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function Status({status}:{status:string}) { const labels:Record<string,string>={PENDING:"รอพิจารณา",APPROVED:"อนุมัติ",ASSIGNED:"ได้รับมอบหมาย",IN_PROGRESS:"กำลังปฏิบัติงาน",REJECTED:"ปฏิเสธ",CANCELLED:"ยกเลิก",COMPLETED:"เสร็จสิ้น"}; const styles:Record<string,string>={PENDING:"bg-amber-50 text-amber-700",APPROVED:"bg-emerald-50 text-emerald-700",ASSIGNED:"bg-teal-50 text-teal-700",IN_PROGRESS:"bg-amber-50 text-amber-700",REJECTED:"bg-rose-50 text-rose-700",CANCELLED:"bg-slate-100 text-slate-600",COMPLETED:"bg-blue-50 text-blue-700"}; return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>{labels[status] ?? status}</span>; }
function usageLogState(item: RequestItem) { const log = item.usageLog; if (!log) return { label: "รอ พขร. บันทึก", style: "bg-amber-50 text-amber-700 ring-amber-100" }; const complete = Boolean(log.lockedAt || (log.actualDepartureAt && log.actualReturnAt && log.odometerStart != null && log.odometerEnd != null)); if (complete) return { label: "บันทึกแล้ว", style: "bg-emerald-50 text-emerald-700 ring-emerald-100" }; return { label: "บันทึกไม่ครบ / กำลังปฏิบัติ", style: "bg-sky-50 text-sky-700 ring-sky-100" }; }
function UsageLogStatus({item}:{item:RequestItem}) { const state = usageLogState(item); return <span className={`mt-1 inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-4 ring-1 ${state.style}`}>{state.label}</span>; }
function Modal({title,message,icon,onClose,onConfirm,busy,confirmText,tone="success"}:{title:string;message:string;icon:React.ReactNode;onClose:()=>void;onConfirm?:()=>void;busy?:boolean;confirmText:string;tone?:"error"|"success"}) { return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4" onMouseDown={onClose}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onMouseDown={e=>e.stopPropagation()}><div className={`mx-auto grid size-12 place-items-center rounded-full ${tone === "error" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{icon}</div><h3 className="mt-4 text-center text-lg font-black text-slate-900">{title}</h3><p className="mt-2 text-center text-sm leading-6 text-slate-500">{message}</p><div className="mt-6 flex justify-center gap-2">{onConfirm ? <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">ยกเลิก</button> : null}<button type="button" onClick={onConfirm ?? onClose} disabled={busy} className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white ${tone === "error" ? "bg-rose-600" : "bg-teal-600"}`}>{busy ? "กำลังดำเนินการ..." : confirmText}</button></div></div></div>; }
