"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, CheckCircle2, ClipboardList, Star, TriangleAlert } from "lucide-react";

type NotificationItem = {
  id: string;
  kind: "EVALUATION" | "PENDING" | "DUE" | "OVERDUE";
  title: string;
  message: string;
  href: string;
  priority: "normal" | "high" | "urgent";
  startAt: string;
};

function Icon({ kind }: { kind: NotificationItem["kind"] }) {
  if (kind === "EVALUATION") return <Star size={17} />;
  if (kind === "OVERDUE") return <TriangleAlert size={17} />;
  if (kind === "DUE") return <BellRing size={17} />;
  return <ClipboardList size={17} />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/mycar/api/v1/notifications/meeting", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { count?: number; items?: NotificationItem[] };
      setCount(Number(data.count ?? 0));
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Notification failure must never affect normal portal usage.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [load]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-50"
        aria-label={`การแจ้งเตือน ${count} รายการ`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[120] w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="font-black text-slate-900">การแจ้งเตือน</p>
              <p className="text-xs text-slate-500">รายการที่ต้องดำเนินการ</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{count}</span>
          </div>

          <div className="max-h-[min(65vh,460px)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">กำลังตรวจสอบรายการ...</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500" size={30} />
                <p className="mt-2 font-bold text-slate-700">ไม่มีรายการที่ต้องดำเนินการ</p>
                <p className="mt-1 text-xs text-slate-400">ระบบจะตรวจสอบให้อัตโนมัติ</p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 border-b border-slate-100 px-4 py-3.5 transition hover:bg-slate-50"
                >
                  <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${item.priority === "urgent" ? "bg-rose-100 text-rose-600" : item.priority === "high" ? "bg-amber-100 text-amber-600" : item.kind === "EVALUATION" ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-600"}`}>
                    <Icon kind={item.kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-800">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.message}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
