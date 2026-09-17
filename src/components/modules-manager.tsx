"use client";
import { useState } from "react";
import { CheckCircle2, Power, Settings2 } from "lucide-react";
import Swal from "sweetalert2";

type App={publicId:string;code:string;nameTh:string;description:string|null;iconKey:string|null;basePath:string|null;status:"ACTIVE"|"INACTIVE";sortOrder:number};
const swalBase={confirmButtonColor:"#0d9488",cancelButtonColor:"#64748b",background:"#fff",color:"#0f172a",customClass:{popup:"app-swal-popup",title:"app-swal-title",htmlContainer:"app-swal-html",confirmButton:"app-swal-confirm",cancelButton:"app-swal-cancel"}};
export default function ModulesManager({initialApplications}:{initialApplications:App[]}){
 const [items,setItems]=useState(initialApplications); const [saving,setSaving]=useState<string|null>(null);
 async function toggle(app:App){
  const next=app.status==="ACTIVE"?"INACTIVE":"ACTIVE";
  const result=await Swal.fire({icon:next==="INACTIVE"?"warning":"question",title:next==="INACTIVE"?"ยืนยันปิดโมดูล?":"ยืนยันเปิดโมดูล?",text:next==="INACTIVE"?`คุณกำลังจะปิด ${app.nameTh}`:`คุณกำลังจะเปิด ${app.nameTh}`,showCancelButton:true,confirmButtonText:next==="INACTIVE"?"ยืนยันปิดโมดูล":"ยืนยันเปิดโมดูล",cancelButtonText:"ยกเลิก",reverseButtons:true,...swalBase});
  if(!result.isConfirmed)return;
  setSaving(app.publicId);
  try{
   const r=await fetch(`/mycar/api/v1/portal/applications/${app.publicId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})});
   const d=await r.json();
   if(!r.ok){await Swal.fire({icon:"error",title:"ดำเนินการไม่สำเร็จ",text:d.error||"ไม่สามารถเปลี่ยนสถานะโมดูลได้",confirmButtonText:"ตกลง",...swalBase});return;}
   setItems(v=>v.map(x=>x.publicId===app.publicId?{...x,status:d.data.status}:x));
   await Swal.fire({icon:"success",title:next==="ACTIVE"?"เปิดโมดูลสำเร็จ":"ปิดโมดูลสำเร็จ",text:`${app.nameTh} ${next==="ACTIVE"?"พร้อมให้บริการแล้ว":"ถูกปิดการใช้งานแล้ว"}`,confirmButtonText:"ตกลง",timer:1500,timerProgressBar:true,...swalBase});
  }catch{await Swal.fire({icon:"error",title:"เชื่อมต่อระบบไม่ได้",text:"ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",confirmButtonText:"ตกลง",...swalBase});}
  finally{setSaving(null)}
 }
 return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Stat label="โมดูลทั้งหมด" value={items.length}/><Stat label="เปิดใช้งาน" value={items.filter(x=>x.status==="ACTIVE").length}/><Stat label="ปิดใช้งาน" value={items.filter(x=>x.status==="INACTIVE").length}/></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50 px-6 py-4"><div className="flex items-center gap-2"><Settings2 size={18} className="text-teal-600"/><h2 className="font-black text-slate-900">โมดูลในระบบ</h2></div><p className="mt-1 text-xs text-slate-500">ปิดโมดูลเพื่อหยุดการให้บริการชั่วคราว โดยสิทธิ์ของผู้ใช้ยังคงอยู่และสามารถเปิดกลับได้</p></div><div className="divide-y divide-slate-100">{items.map(app=><div key={app.publicId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-xl">{app.iconKey==="car"?"🚗":app.iconKey==="calendar"?"📅":app.iconKey==="hospital"?"🏥":"▣"}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{app.nameTh}</h3><span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-500">{app.code}</span></div><p className="mt-1 text-sm text-slate-500">{app.description||"ไม่มีคำอธิบาย"}</p><p className="mt-1 text-xs text-slate-400">เส้นทาง: {app.basePath||"-"}</p></div><div className="flex items-center gap-3"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${app.status==="ACTIVE"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{app.status==="ACTIVE"?<CheckCircle2 size={14}/>:null}{app.status==="ACTIVE"?"เปิดใช้งาน":"ปิดใช้งาน"}</span><button type="button" disabled={saving===app.publicId} onClick={()=>toggle(app)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${app.status==="ACTIVE"?"border border-rose-200 bg-white text-rose-600 hover:bg-rose-50":"bg-teal-600 text-white hover:bg-teal-700"}`}><Power size={16}/>{saving===app.publicId?"กำลังบันทึก...":app.status==="ACTIVE"?"ปิดโมดูล":"เปิดโมดูล"}</button></div></div>)}</div></div></div>
}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p></div>}
