import { getCurrentUser } from "@/modules/identity/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyMeetingBookingsManager from "@/components/my-meeting-bookings-manager";
export default async function MyBookings(){const user=await getCurrentUser();if(!user)redirect('/login');const rows=await prisma.meetingBooking.findMany({where:{requesterId:user.id},orderBy:{startAt:'desc'},include:{room:{select:{nameTh:true,location:true}},evaluation:{select:{publicId:true,overallRating:true}}}});return <section><div className="mb-6"><p className="text-sm font-bold tracking-[0.14em] text-teal-700">MY BOOKINGS</p><h1 className="mt-1 text-3xl font-black text-slate-900">รายการจองของฉัน</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบสถานะ รายละเอียด แก้ไข หรือยกเลิกรายการจองของคุณ</p></div><MyMeetingBookingsManager rows={rows}/></section>;}
