"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function SweetAlertProvider(){
  useEffect(()=>{
    const originalAlert=window.alert;
    const showValidationError = async (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      const label = element.closest("label")?.querySelector(".label, label > span:first-child")?.textContent?.replace(/\s*\*\s*$/, "").trim();
      const name = label || element.getAttribute("aria-label") || element.getAttribute("placeholder") || "ช่องข้อมูลนี้";
      let text = `กรุณากรอก${name}`;
      if (element.validity.typeMismatch) text = `กรุณากรอก${name}ให้ถูกต้อง`;
      else if (element.validity.patternMismatch) text = `กรุณากรอก${name}ให้ถูกต้องตามรูปแบบ`;
      else if (element.validity.rangeUnderflow || element.validity.rangeOverflow) text = `กรุณาระบุ${name}ให้อยู่ในช่วงที่กำหนด`;
      await Swal.fire({
        icon:"warning", title:"กรุณาตรวจสอบข้อมูล", text,
        confirmButtonText:"ตกลง", confirmButtonColor:"#0d9488",
        background:"#fff", color:"#0f172a",
        allowOutsideClick:true, buttonsStyling:true,
        customClass:{popup:"app-swal-popup",title:"app-swal-title",htmlContainer:"app-swal-html",confirmButton:"app-swal-confirm"}
      });
      element.focus();
    };
    let validationOpen=false;
    const handleInvalid = (event: Event) => {
      event.preventDefault();
      const element=event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if(validationOpen)return;
      validationOpen=true;
      showValidationError(element).finally(()=>{validationOpen=false});
    };
    document.addEventListener("invalid", handleInvalid, true);
    window.alert=(message?:unknown)=>{void Swal.fire({icon:"error",title:"เกิดข้อผิดพลาด",text:String(message??"ไม่สามารถดำเนินการได้"),confirmButtonText:"ตกลง",confirmButtonColor:"#0d9488",background:"#fff",color:"#0f172a",customClass:{popup:"app-swal-popup",title:"app-swal-title",htmlContainer:"app-swal-html",confirmButton:"app-swal-confirm"}})};
    return()=>{window.alert=originalAlert;document.removeEventListener("invalid", handleInvalid, true)};
  },[]);
  return null;
}
