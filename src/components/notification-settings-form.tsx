"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, Eye, EyeOff, Info, Save, ShieldCheck, Send, Loader2, Power } from "lucide-react";
import Swal from "sweetalert2";

const fields = [
  ["MOPH_NOTIFY_BASE_URL", "รายบุคคล Base URL / Endpoint", "API Alert Free Form JSON 3.1 (เช่น https://morpromt2c.moph.go.th หรือ URL เต็ม /alert/v3.1/messages)", false],
  ["MOPH_NOTIFY_CLIENT_KEY", "รายบุคคล client-key", "client-key จาก CMS MOPH ALERTING สำหรับ API รายบุคคล", true],
  ["MOPH_NOTIFY_SECRET_KEY", "รายบุคคล secret-key", "secret-key จาก CMS MOPH ALERTING สำหรับ API รายบุคคล", true],
  ["MOPH_NOTIFY_GROUP_BASE_URL", "LINE กลุ่ม Base URL / Endpoint", "ใส่ Base URL หรือ URL เต็มได้ เช่น https://morpromt2f.moph.go.th/api/notify/send ระบบจะไม่เติม path ซ้ำ", false],
  ["MOPH_NOTIFY_GROUP_CLIENT_KEY", "LINE กลุ่ม client-key", "client-key จากเมนูหน่วยบริการใน CMS MOPH Notify สำหรับ API กลุ่ม ต้องใช้คนละชุดกับ MOPH Alert", true],
  ["MOPH_NOTIFY_GROUP_SECRET_KEY", "LINE กลุ่ม secret-key", "secret-key จากเมนูหน่วยบริการใน CMS MOPH Notify สำหรับ API กลุ่ม ต้องใช้คนละชุดกับ MOPH Alert", true],
] as const;

export default function NotificationSettingsForm({ initialValues, configuredKeys }: { initialValues: Record<string, string>; configuredKeys: string[] }) {
  const [values, setValues] = useState<Record<string, string>>({ ...initialValues, MOPH_NOTIFY_GROUP_ENABLED: initialValues.MOPH_NOTIFY_GROUP_ENABLED === "true" ? "true" : "false" });
  const [configured, setConfigured] = useState(new Set(configuredKeys));
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState("ทดสอบการแจ้งเตือน MOPH Notify จากระบบขอใช้รถยนต์");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const groupEnabled = values.MOPH_NOTIFY_GROUP_ENABLED === "true";
  const configuredCount = useMemo(() => fields.filter(([key]) => configured.has(key)).length + (configured.has("MOPH_NOTIFY_GROUP_ENABLED") ? 1 : 0), [configured]);

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/mycar/api/v1/notifications/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "บันทึกไม่สำเร็จ");
      setConfigured((current) => new Set([...current, ...Object.keys(values).filter((key) => Boolean(values[key]))]));
      setValues((current) => ({ ...current, MOPH_NOTIFY_CLIENT_KEY: "", MOPH_NOTIFY_SECRET_KEY: "", MOPH_NOTIFY_GROUP_CLIENT_KEY: "", MOPH_NOTIFY_GROUP_SECRET_KEY: "" }));
      setMessage("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      await Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", text: "บันทึกการตั้งค่า MOPH Notify เรียบร้อยแล้ว", confirmButtonText: "ตกลง", confirmButtonColor: "#0d9488" });
    } catch (error) { const text = error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"; setMessage(text); await Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text, confirmButtonText: "ตกลง", confirmButtonColor: "#0d9488" }); }
    finally { setSaving(false); }
  }

  async function testGroup() {
    setTesting(true); setTestResult("");
    try {
      const response = await fetch("/mycar/api/v1/notifications/settings/test-group", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: testMessage }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "ส่งข้อความทดสอบไม่สำเร็จ");
      setTestResult(`ส่งสำเร็จ • HTTP ${payload.httpStatus ?? "-"} • code ${payload.messageCode ?? "-"}`);
      await Swal.fire({ icon: "success", title: "ส่งข้อความสำเร็จ", text: `MOPH Notify ตอบกลับ HTTP ${payload.httpStatus ?? "-"} • code ${payload.messageCode ?? "-"}`, confirmButtonText: "ตกลง", confirmButtonColor: "#0d9488" });
    } catch (error) { const text = error instanceof Error ? error.message : "ส่งข้อความทดสอบไม่สำเร็จ"; setTestResult(text); await Swal.fire({ icon: "error", title: "ส่งข้อความไม่สำเร็จ", text, confirmButtonText: "ตกลง", confirmButtonColor: "#0d9488" }); }
    finally { setTesting(false); }
  }

  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">
      <StatusCard icon={<BellRing size={19}/>} label="บริการแจ้งเตือน" value="MOPH Notify" tone="amber" />
      <StatusCard icon={<CheckCircle2 size={19}/>} label="รายการตั้งค่า" value={`${configuredCount} / ${fields.length + 1}`} tone={configuredCount === fields.length + 1 ? "emerald" : "blue"} />
      <StatusCard icon={<ShieldCheck size={19}/>} label="ข้อมูลลับ" value="ไม่แสดงค่าที่บันทึก" tone="violet" />
    </div>
    <div className="rounded-[1.75rem] border border-teal-200 bg-teal-50 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1"><span className="mb-2 block text-sm font-bold text-teal-950">ทดสอบแจ้งเตือนเข้า LINE กลุ่ม</span><textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} maxLength={1000} rows={3} className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100" placeholder="ข้อความที่จะส่งทดสอบ"/><span className="mt-1 block text-xs text-teal-800">ข้อความนี้จะส่งจริงเข้า LINE กลุ่มที่ผูกกับ MOPH Notify</span></label>
        <button type="button" onClick={testGroup} disabled={testing || !testMessage.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50">{testing ? <Loader2 size={17} className="animate-spin"/> : <Send size={17}/>} {testing ? "กำลังส่ง..." : "ส่งข้อความทดสอบ"}</button>
      </div>
      {testResult ? <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${testResult.startsWith("ส่งสำเร็จ") ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{testResult}</div> : null}
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.45fr_.85fr]">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-black text-slate-900">การเชื่อมต่อ MOPH Notify</h2><p className="mt-1 text-xs text-slate-500">รองรับทั้งการส่งรายบุคคลและการส่งเข้า LINE group chats</p></div>
        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><div className="text-sm font-bold text-slate-800">เปิดส่ง LINE กลุ่ม</div><p className="mt-1 text-xs text-slate-500">กดปุ่มเพื่อเปิดหรือปิดการส่งแจ้งเตือนเข้า LINE กลุ่ม</p></div><button type="button" role="switch" aria-checked={groupEnabled} onClick={() => setValues((current) => ({ ...current, MOPH_NOTIFY_GROUP_ENABLED: groupEnabled ? "false" : "true" }))} className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${groupEnabled ? "bg-teal-600" : "bg-slate-300"}`}><span className={`inline-flex size-6 items-center justify-center rounded-full bg-white shadow-sm transition ${groupEnabled ? "translate-x-7" : "translate-x-1"}`}><Power size={13} className={groupEnabled ? "text-teal-600" : "text-slate-400"}/></span></button></div><div className="mt-2 text-xs font-bold"><span className={groupEnabled ? "text-teal-700" : "text-slate-500"}>{groupEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span></div></div>
          {fields.map(([key, label, description, secret]) => { const isConfigured = configured.has(key); const visible = showSecret[key] ?? false; return <label key={key} className="block"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-800">{label}</span>{isConfigured ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 size={13}/>ตั้งค่าแล้ว</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">ยังไม่ได้ตั้งค่า</span>}</div><div className="relative"><input value={values[key] ?? ""} onChange={(e) => setValues((current) => ({ ...current, [key]: e.target.value }))} type={secret && !visible ? "password" : "text"} placeholder={isConfigured && secret ? "•••••••• (เว้นว่างเพื่อคงค่าเดิม)" : key === "MOPH_NOTIFY_BASE_URL" ? "https://morpromt2c.moph.go.th" : key === "MOPH_NOTIFY_GROUP_BASE_URL" ? "https://morpromt2f.moph.go.th/api/notify/send" : "กรอกค่า"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-50" />{secret ? <button type="button" onClick={() => setShowSecret((current) => ({ ...current, [key]: !visible }))} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label={visible ? "ซ่อนค่า" : "แสดงค่า"}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button> : null}</div><p className="mt-2 text-xs leading-5 text-slate-500">{description}</p></label>; })}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">{message ? <p className={`mr-auto text-sm ${message.includes("เรียบร้อย") ? "text-emerald-700" : "text-rose-600"}`}>{message}</p> : null}<button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50"><Save size={17}/>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</button></div>
      </div>
      <div className="space-y-5">
        <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6"><div className="flex gap-3"><Info className="mt-0.5 shrink-0 text-blue-700" size={21}/><div><h2 className="font-black text-blue-950">รายบุคคล</h2><p className="mt-2 text-sm leading-6 text-blue-900">ใช้ <strong>POST /alert/v3.1/messages</strong> ตามเอกสาร API Alert Free Form JSON 3.1 โดยส่ง <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">cid</code> เป็น array และใช้ client-key/secret-key ของ CMS MOPH ALERTING</p></div></div></div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={21}/><div><h2 className="font-black text-emerald-950">LINE กลุ่ม</h2><p className="mt-2 text-sm leading-6 text-emerald-900">ใช้ <strong>POST /api/notify/send</strong> ตามเอกสาร API Document MOPH Notify โดยส่ง <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">messages</code> เป็น Array ของ LINE message และใช้ client-key/secret-key จากเมนูหน่วยบริการใน CMS MOPH Notify</p></div></div></div>
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><Info className="mt-0.5 shrink-0 text-amber-700" size={21}/><div><h2 className="font-black text-amber-950">สำคัญ</h2><p className="mt-2 text-sm leading-6 text-amber-900">ตัวอย่าง MOPH Notify ที่ใช้งานได้กำหนด URL เป็น <strong>https://morpromt2f.moph.go.th/api/notify/send</strong> โดยตรง ระบบรองรับทั้งการกรอก URL เต็มและ Base URL</p></div></div></div>
      </div>
    </div>
  </div>;
}

function StatusCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "amber" | "emerald" | "blue" | "violet" }) { const tones = { amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700" }; return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-0.5 font-black text-slate-900">{value}</p></div></div></div>; }
