"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Ban } from "lucide-react";
import Swal from "sweetalert2";

const swalBase={confirmButtonColor:"#0d9488",cancelButtonColor:"#64748b",customClass:{popup:"rounded-[1.5rem]",confirmButton:"rounded-xl px-5 py-2.5 font-bold",cancelButton:"rounded-xl px-5 py-2.5 font-bold"}};
export default function VehicleRequestActions({ publicId, canEdit, canCancel }: { publicId: string; canEdit: boolean; canCancel: boolean }) {
  const router = useRouter(); const [saving, setSaving] = useState(false);
  async function cancelRequest() {
    const result=await Swal.fire({icon:"warning",title:"ยืนยันยกเลิกคำขอใช้รถ?",text:"ระบบจะไม่ลบข้อมูล แต่จะเปลี่ยนสถานะเป็น “ยกเลิก”",showCancelButton:true,confirmButtonText:"ยืนยันยกเลิก",cancelButtonText:"กลับ",reverseButtons:true,...swalBase});
    if(!result.isConfirmed)return; setSaving(true);
    try { const response=await fetch(`/mycar/api/v1/vehicle-requests/${publicId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"CANCEL"})}); const payload=await response.json(); if(!response.ok)return void Swal.fire({icon:"error",title:"ยกเลิกไม่สำเร็จ",text:payload.error??"ไม่สามารถยกเลิกคำขอได้",confirmButtonText:"ตกลง",...swalBase}); await Swal.fire({icon:"success",title:"ยกเลิกคำขอแล้ว",text:"ระบบบันทึกการยกเลิกเรียบร้อยแล้ว",confirmButtonText:"ตกลง",timer:1600,timerProgressBar:true,...swalBase}); router.refresh(); }
    catch { await Swal.fire({icon:"error",title:"เชื่อมต่อระบบไม่ได้",text:"กรุณาลองใหม่อีกครั้ง",confirmButtonText:"ตกลง",...swalBase}); } finally { setSaving(false); }
  }
  if (!canEdit && !canCancel) return null;
  return <div className="flex flex-wrap items-center gap-2">{canEdit?<Link href={`/dashboard/vehicle-requests?edit=${publicId}`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil size={14}/>แก้ไข</Link>:null}{canCancel?<button type="button" onClick={cancelRequest} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><Ban size={14}/>{saving?"กำลังยกเลิก...":"ยกเลิกคำขอ"}</button>:null}</div>;
}
