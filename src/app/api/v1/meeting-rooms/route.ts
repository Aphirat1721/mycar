import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";

async function nextRoomCode() {
  const rows = await prisma.meetingRoom.findMany({ select: { code: true } });
  const used = new Set(rows.map((row) => Number(row.code.match(/^MR-(\d{2})$/)?.[1] ?? 0)).filter((n) => n >= 1 && n <= 99));
  const next = Array.from({ length: 99 }, (_, i) => i + 1).find((n) => !used.has(n));
  if (!next) throw new Error("ไม่สามารถสร้างรหัสห้อง MR-xx ได้ เนื่องจากมีรหัสครบ MR-01 ถึง MR-99 แล้ว");
  return `MR-${String(next).padStart(2, "0")}`;
}
export async function GET(){const rooms=await prisma.meetingRoom.findMany({where:{status:"ACTIVE",deletedAt:null},orderBy:{nameTh:"asc"},select:{publicId:true,code:true,nameTh:true,location:true,capacity:true,description:true,imagePath:true,status:true}});return NextResponse.json({rooms});}
export async function POST(request:Request){try{await requireAdmin("MEETING_ROOMS");const b=await request.json();const nameTh=String(b.nameTh||"").trim();const capacity=Number(b.capacity);if(!nameTh||!Number.isInteger(capacity)||capacity<1)return NextResponse.json({error:"กรุณากรอกข้อมูลห้องประชุมให้ครบ"},{status:400});const code=await nextRoomCode();const row=await prisma.meetingRoom.create({data:{code,nameTh,location:b.location?String(b.location):null,capacity,description:b.description?String(b.description):null,imagePath:b.imagePath?String(b.imagePath):null,status:"ACTIVE",updatedAt:new Date()}});return NextResponse.json({data:row},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"ไม่สามารถบันทึกได้"},{status:400});}}
