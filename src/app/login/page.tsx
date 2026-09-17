import { ArrowRight, CalendarDays, CarFront, ClipboardList, LayoutGrid, ShieldCheck, Sparkles } from "lucide-react";

const services = [
  { Icon: CarFront, label: "งานยานพาหนะ", tone: "teal" },
  { Icon: CalendarDays, label: "ห้องประชุม", tone: "blue" },
  { Icon: ClipboardList, label: "บริการภายใน", tone: "violet" },
];

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <LoginContent searchParams={searchParams} />;
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error;
  const messages: Record<string, string> = {
    unauthorized: "บัญชีนี้ไม่มีสิทธิ์ใช้งานระบบสำหรับหน่วยบริการ 11061",
    oauth: "การเข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    state: "คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาเริ่มใหม่",
  };

  return (
    <main className="login-page min-h-screen overflow-hidden">
      <div className="login-grid" aria-hidden="true" />
      <div className="login-glow login-glow-a" aria-hidden="true" />
      <div className="login-glow login-glow-b" aria-hidden="true" />
      <div className="login-glow login-glow-c" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_430px] lg:px-12 xl:gap-20">
        <section className="hidden lg:block">
          <div className="login-brand inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/65 px-4 py-2.5 shadow-sm backdrop-blur-xl">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-white shadow-lg">
              <LayoutGrid size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">โรงพยาบาลเกษตรวิสัย</p>
              <p className="text-[11px] font-medium text-slate-400">ระบบบริการดิจิทัล • หน่วยบริการ 11061</p>
            </div>
          </div>

          <div className="mt-12 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700">
              <Sparkles size={15} />
              <span>Digital Services Platform</span>
            </div>
            <h1 className="text-6xl font-extrabold leading-[1.08] tracking-[-0.045em] text-slate-950 xl:text-7xl">
              ระบบบริการดิจิทัล
              <span className="login-title-gradient mt-2 block">สำหรับบุคลากร</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-500">
              เข้าถึงบริการและเครื่องมือสำหรับการทำงานของโรงพยาบาล
              ได้จากพื้นที่เดียว พร้อมการยืนยันตัวตนที่ปลอดภัย
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {services.map(({ Icon, label, tone }) => (
              <div key={label} className={`login-service login-service-${tone}`}>
                <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm">
                  <Icon size={19} />
                </span>
                <span className="text-sm font-bold text-slate-700">{label}</span>
              </div>
            ))}
            <div className="login-service login-service-more">
              <span className="grid size-10 place-items-center rounded-xl bg-white/80 shadow-sm"><LayoutGrid size={18} /></span>
              <span className="text-sm font-bold text-slate-500">และบริการอื่น ๆ</span>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px w-12 bg-slate-300" />
            <span>เข้าสู่ระบบครั้งเดียว เพื่อใช้งานบริการที่ได้รับสิทธิ์</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="login-card rounded-[2rem] p-7 sm:p-9">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg"><LayoutGrid size={22} /></span>
                <div>
                  <p className="text-sm font-bold text-slate-800">โรงพยาบาลเกษตรวิสัย</p>
                  <p className="text-[11px] text-slate-400">ระบบบริการดิจิทัล</p>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-teal-600">
                <span className="login-status-dot" /> ระบบพร้อมให้บริการ
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">ยินดีต้อนรับ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">เข้าสู่ระบบเพื่อใช้งานบริการต่าง ๆ ของโรงพยาบาล</p>
            </div>

            {error ? (
              <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {messages[error] ?? messages.oauth}
              </div>
            ) : null}

            <a
              href="/mycar/api/v1/auth/provider/login"
              className="login-provider-button group flex min-h-16 w-full items-center gap-3 rounded-2xl px-5 text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-teal-100"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10"><ShieldCheck size={20} /></span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-extrabold">เข้าสู่ระบบด้วย Provider ID</span>
                <span className="mt-0.5 block text-[11px] font-medium text-white/60">ยืนยันตัวตนอย่างปลอดภัย</span>
              </span>
              <ArrowRight className="transition-transform group-hover:translate-x-1" size={19} />
            </a>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><ShieldCheck size={17} /></span>
                <div>
                  <p className="text-xs font-bold text-slate-700">การเข้าใช้งานที่ปลอดภัย</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">ระบบจะตรวจสอบสิทธิ์และหน่วยบริการจากข้อมูล Provider ID โดยอัตโนมัติ</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">โรงพยาบาลเกษตรวิสัย • Digital Services</p>
        </section>
      </div>
    </main>
  );
}
