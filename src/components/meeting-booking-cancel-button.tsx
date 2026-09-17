"use client";
import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const swalBase={confirmButtonColor:"#0d9488",cancelButtonColor:"#64748b",customClass:{popup:"rounded-[1.5rem]",confirmButton:"rounded-xl px-5 py-2.5 font-bold",cancelButton:"rounded-xl px-5 py-2.5 font-bold"}};
export default function MeetingBookingCancelButton({publicId}:{publicId:string}){
 const [busy,setBusy]=useState(false); const router=useRouter();
 const cancel=async()=>{const result=await Swal.fire({icon:"warning",title:"ยืนยันการยกเลิกการจอง?",text:"กรุณาระบุเหตุผลการยกเลิก",input:"textarea",inputPlaceholder:"เหตุผลการยกเลิก",inputAttributes:{maxlength:"1000"},showCancelButton:true,inputValidator:(v)=>!String(v||"").trim()?"กรุณาระบุเหตุผลการยกเลิก":undefined,confirmButtonText:"ยืนยันยกเลิก",cancelButtonText:"กลับ",reverseButtons:true,...swalBase});if(!result.isConfirmed)return;setBusy(true);try{const r=await fetch(`/mycar/api/v1/meeting-bookings/${publicId}`,{method:"DELETE",headers:{"content-type":"application/json"},body:JSON.stringify({reason:String(result.value||"").trim()})});const d=await r.json();if(!r.ok){await Swal.fire({icon:"error",title:"ยกเลิกไม่สำเร็จ",text:d.error||"ไม่สามารถยกเลิกการจองได้",confirmButtonText:"ตกลง",...swalBase});return}await Swal.fire({icon:"success",title:"ยกเลิกการจองแล้ว",text:"ระบบบันทึกการยกเลิกเรียบร้อยแล้ว",confirmButtonText:"ตกลง",timer:1600,timerProgressBar:true,...swalBase});router.refresh()}catch{await Swal.fire({icon:"error",title:"เชื่อมต่อระบบไม่ได้",text:"กรุณาลองใหม่อีกครั้ง",confirmButtonText:"ตกลง",...swalBase})}finally{setBusy(false)}};
 return <button type="button" onClick={cancel} disabled={busy} className="ml-2 inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">{busy?<Loader2 size={14} className="animate-spin"/>:<Ban size={14}/>}ยกเลิก</button>;
}
