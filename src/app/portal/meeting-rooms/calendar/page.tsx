import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/identity/session";
import MeetingCalendarGrid from "@/components/meeting-calendar-grid";
export default async function MeetingCalendar(){const user=await getCurrentUser();const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),1);const end=new Date(now.getFullYear(),now.getMonth()+1,1);const bookings=await prisma.meetingBooking.findMany({where:{startAt:{lt:end},endAt:{gte:start},status:{in:["PENDING","APPROVED"]}},orderBy:{startAt:"asc"},include:{room:{select:{publicId:true,nameTh:true}},requester:{select:{id:true,nameTh:true,firstnameTh:true,lastnameTh:true,department:{select:{nameTh:true}}}}}});return <MeetingCalendarGrid bookings={bookings} month={start} currentUserId={user?.id}/>;}
