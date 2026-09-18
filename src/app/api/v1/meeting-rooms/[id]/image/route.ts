import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{await requireAdmin("MEETING_ROOMS");const id=(await params).id;const form=await request.formData();const file=form.get("file");if(!(file instanceof File))return NextResponse.json({error:"ไม่พบไฟล์รูปภาพ"},{status:400});if(file.size>5*1024*1024)return NextResponse.json({error:"ไฟล์ต้องมีขนาดไม่เกิน 5 MB"},{status:400});if(!["image/jpeg","image/png","image/webp"].includes(file.type))return NextResponse.json({error:"รองรับ JPG, PNG และ WebP เท่านั้น"},{status:400});const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const dir=path.join(process.cwd(),"public","uploads","meeting-rooms");await mkdir(dir,{recursive:true});const name=`${randomUUID()}.${ext}`;await writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()));const imagePath=`/uploads/meeting-rooms/${name}`;const row=await prisma.meetingRoom.update({where:{publicId:id},data:{imagePath}});return NextResponse.json({data:row});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"ไม่สามารถอัปโหลดรูปได้"},{status:400});}}
