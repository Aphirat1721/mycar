"use client";
import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function validIso(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value); }
function validThai(value: string) { return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value); }
function toIso(value: string) {
  if (validIso(value)) return value;
  if (validThai(value)) {
    const [d, m, y] = value.split("/");
    const yy = Number(y) > 2400 ? Number(y) - 543 : Number(y);
    return `${yy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}
function displayDate(value: string) {
  const iso = toIso(value);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${Number(y) + 543}`;
}
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DatePicker({
  value, onChange, min, max, placeholder = "dd/mm/yyyy", output = "iso"
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  output?: "iso" | "thai";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isoValue = toIso(value);
  const base = validIso(isoValue) ? new Date(`${isoValue}T12:00:00`) : new Date();
  const initialMonth = new Date(base.getFullYear(), base.getMonth(), 1);
  const [month, setMonth] = useState(initialMonth);
  const [open, setOpen] = useState(false);
  const today = todayIso();

  const handleOpen = () => {
    if (isoValue) {
      const d = new Date(`${isoValue}T12:00:00`);
      setMonth((current) => {
        const next = new Date(d.getFullYear(), d.getMonth(), 1);
        return current.getTime() === next.getTime() ? current : next;
      });
    }
    setOpen((v) => !v);
  };

  const minIso = toIso(min || "");
  const maxIso = toIso(max || "");
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthName = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { month: "long", year: "numeric" }).format(month);

  const choose = (day: number) => {
    const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if ((minIso && iso < minIso) || (maxIso && iso > maxIso)) return;
    const [y, m, d] = iso.split("-");
    onChange(output === "thai" ? `${d}/${m}/${Number(y) + 543}` : iso);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="date-picker relative">
      <button type="button" onClick={handleOpen} className="date-picker-trigger input flex w-full items-center justify-between text-left" aria-label="เลือกวันที่" aria-expanded={open}>
        <span className={`date-picker-value ${value ? "date-picker-value-selected" : "date-picker-value-placeholder"}`}>{value ? displayDate(value) : placeholder}</span>
        <CalendarDays size={18} className="date-picker-icon shrink-0" />
      </button>

      {open && (
        <div className="date-picker-popup absolute left-0 top-full z-[100] mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-8 place-items-center rounded-lg hover:bg-slate-100" aria-label="เดือนก่อนหน้า"><ChevronLeft size={17} /></button>
            <span className="text-sm font-black text-slate-800">{monthName}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-8 place-items-center rounded-lg hover:bg-slate-100" aria-label="เดือนถัดไป"><ChevronRight size={17} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => <div key={d} className="p-1">{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: first }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const disabled = !!((minIso && iso < minIso) || (maxIso && iso > maxIso));
              const selected = isoValue === iso;
              const isToday = today === iso;
              return <button key={day} type="button" disabled={disabled} onClick={() => choose(day)} aria-current={isToday ? "date" : undefined} className={`date-picker-day h-9 rounded-lg text-sm font-semibold ${selected ? "date-picker-day-selected" : ""} ${isToday && !selected ? "date-picker-day-today" : ""} ${disabled ? "cursor-not-allowed opacity-25" : ""}`}><span className={isToday ? "date-picker-today-number" : undefined}>{day}</span></button>;
            })}
          </div>
          <div className="date-picker-today-label">วันนี้ {new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</div>
        </div>
      )}
    </div>
  );
}
