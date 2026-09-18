import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import MeetingEquipmentManager from "@/components/meeting-equipment-manager";
export default async function EquipmentPage(){await requireAdmin("MEETING_ROOMS");const rows=await prisma.meetingEquipment.findMany({orderBy:[{status:"asc"},{nameTh:"asc"}]});return <section className="mx-auto max-w-5xl"><div className="mb-5 flex flex-wrap gap-3"><Link href="/portal" className="inline-flex items-center gap-2 text-sm font-bold text-teal-700"><ArrowLeft size={16}/> Portal</Link><span className="text-sm text-slate-400">/</span><Link href="/portal/meeting-rooms/settings" className="text-sm font-bold text-teal-700">ตั้งค่าระบบจองห้องประชุม</Link></div><MeetingEquipmentManager initial={rows.map(x=>({id:x.publicId,code:x.code,nameTh:x.nameTh,description:x.description,status:x.status}))}/></section>}
