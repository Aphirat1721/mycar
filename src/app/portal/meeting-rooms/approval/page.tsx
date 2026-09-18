import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";
import { hasApplicationRole, hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import MeetingBookingApprovalList from "@/components/meeting-booking-approval-list";

export default async function MeetingBookingApprovalPage(){
 const user=await getCurrentUser();
 if(!user) redirect("/login");
 const isAdmin=await hasApplicationRole(user.id,"MEETING_ROOMS");
 if(!isAdmin && !(await hasPermission(user.id,"APPROVE_MEETING_BOOKINGS","MEETING_ROOMS"))) redirect("/portal/meeting-rooms");
 const bookings=await prisma.meetingBooking.findMany({where:{status:{in:["PENDING","APPROVED","REJECTED","CANCELLED"]}},orderBy:{startAt:"asc"},include:{room:{select:{nameTh:true,location:true}},requester:{select:{nameTh:true,firstnameTh:true,lastnameTh:true,department:{select:{nameTh:true}}}}}});
 return <section><div className="mb-6"><p className="text-sm font-bold tracking-[0.14em] text-teal-700">APPROVAL</p><h1 className="mt-1 text-3xl font-black text-slate-900">อนุมัติการจองห้องประชุม</h1><p className="mt-2 text-sm text-slate-500">ตรวจสอบรายการที่รออนุมัติ และอนุมัติ ไม่อนุมัติ หรือยกเลิกตามสิทธิ์ที่ได้รับ</p></div><MeetingBookingApprovalList initialBookings={bookings}/></section>;
}
