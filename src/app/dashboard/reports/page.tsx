import { BarChart3, ClipboardList, CarFront, UserRound, Building2, ChartNoAxesColumn, Fuel, History } from "lucide-react";
import Link from "next/link";

const reports = [
  { href: "/dashboard/reports/vehicle-requests", icon: ClipboardList, title: "รายงานคำขอใช้รถ", description: "สรุปคำขอ แยกตามช่วงเวลา สถานะ และหน่วยงาน" },
  { href: "/dashboard/reports/trips", icon: CarFront, title: "รายงานการใช้รถ / ภารกิจ", description: "ตรวจสอบภารกิจ สถานที่ วัตถุประสงค์ และช่วงเวลาใช้งาน" },
  { href: "/dashboard/reports/vehicles", icon: CarFront, title: "รายงานการใช้รถแยกรายคัน", description: "ดูจำนวนเที่ยวและประวัติการใช้งานของรถแต่ละคัน" },
  { href: "/dashboard/reports/drivers", icon: UserRound, title: "รายงานการปฏิบัติงาน พขร.", description: "สรุปภารกิจและการปฏิบัติงานของพนักงานขับรถ" },
  { href: "/dashboard/reports/departments", icon: Building2, title: "รายงานการใช้รถแยกหน่วยงาน", description: "เปรียบเทียบการขอใช้รถของแต่ละหน่วยงาน" },
  { href: "/dashboard/reports/statistics", icon: ChartNoAxesColumn, title: "รายงานสถิติคำขอใช้รถ", description: "สถิติรายวัน รายเดือน รายปี และแนวโน้มสถานะคำขอ" },
  { href: "/dashboard/reports/expenses", icon: Fuel, title: "รายงานค่าใช้จ่าย", description: "เตรียมสำหรับข้อมูลเชื้อเพลิงและค่าใช้จ่ายการเดินทาง" },
  { href: "/dashboard/reports/audit", icon: History, title: "รายงานประวัติการดำเนินการ", description: "ตรวจสอบประวัติการดำเนินการและ Audit Log" },
];

export default function ReportsPage() {
  return <div className="space-y-7"><div><p className="text-sm font-semibold text-teal-700">รายงาน</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">รายงานระบบขอใช้รถยนต์</h1><p className="mt-2 text-sm text-slate-500">เลือกรายงานที่ต้องการดู ระบบจะพัฒนาเครื่องมือค้นหาและส่งออกข้อมูลในแต่ละรายงานต่อไป</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reports.map(({ href, icon: Icon, title, description }) => <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={21}/></span><div><h2 className="font-black text-slate-900 group-hover:text-teal-700">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div></Link>)}</div><div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600"><BarChart3 size={18} className="mr-2 inline text-teal-600"/><b>แนวทางการพัฒนารายงาน:</b> ทุกหน้ารายงานจะใช้ตัวกรองช่วงวันที่ หน่วยงาน รถ พขร. และสถานะตามความเหมาะสม พร้อมเตรียมรองรับ Excel/PDF</div></div>;
}
