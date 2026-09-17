"use client";
import { useState } from "react";

const labels = ["น้อยมาก", "น้อย", "ปานกลาง", "ดี", "ดีมาก"];

export default function DriverEvaluationForm({ requestId, initialRating = 0, initialFeedback = "", locked = false }: { requestId: string; initialRating?: number; initialFeedback?: string; locked?: boolean }) {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    if (!rating) return setMessage("กรุณาให้คะแนน");
    setSaving(true); setMessage("");
    const res = await fetch(`/mycar/api/v1/vehicle-requests/${requestId}/evaluation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, feedback }) });
    const data = await res.json(); setSaving(false); setMessage(res.ok ? "บันทึกการประเมินแล้ว" : (data.error || "บันทึกไม่สำเร็จ"));
  }
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="text-sm font-bold text-slate-800">ประเมินพนักงานขับรถ</div><div className="mt-4 flex flex-wrap gap-2">{labels.map((label, i) => { const value=i+1; return <button key={value} type="button" disabled={locked || saving} onClick={() => setRating(value)} className={`rounded-xl border px-4 py-2 text-xs font-bold ${rating===value ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{value} — {label}</button>; })}</div><textarea maxLength={255} value={feedback} disabled={locked || saving} onChange={e=>setFeedback(e.target.value)} placeholder="ข้อเสนอแนะเพิ่มเติม (ไม่เกิน 255 ตัวอักษร)" className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-teal-500" /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-slate-400">{feedback.length}/255</span>{!locked && <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? "กำลังบันทึก..." : initialRating ? "แก้ไขการประเมิน" : "บันทึกการประเมิน"}</button>}</div>{message && <p className="mt-3 text-xs font-semibold text-slate-600">{message}</p>}</div>;
}
