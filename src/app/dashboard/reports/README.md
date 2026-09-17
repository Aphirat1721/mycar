# รายงานระบบ mycar

รายงานชุดนี้ออกแบบให้ใช้ข้อมูลธุรกรรมจริงจาก `VehicleRequest`, ข้อมูลรถ/พนักงานขับรถ/หน่วยงาน และ `AuditLog` โดยตัวกรองมาตรฐานคือช่วงวันที่, สถานะ, หน่วยงาน, รถ และ พขร. ตามความเหมาะสม

## รายงานที่พัฒนา
1. รายงานคำขอใช้รถ — `/dashboard/reports/vehicle-requests`
2. รายงานการใช้รถ / ภารกิจ — `/dashboard/reports/trips`
3. รายงานการใช้รถแยกรายคัน — `/dashboard/reports/vehicles`
4. รายงานการปฏิบัติงาน พขร. — `/dashboard/reports/drivers`
5. รายงานการใช้รถแยกหน่วยงาน — `/dashboard/reports/departments`
6. รายงานสถิติคำขอใช้รถ — `/dashboard/reports/statistics`
7. รายงานค่าใช้จ่าย — `/dashboard/reports/expenses` (ยังไม่มี schema ค่าใช้จ่าย จึงแสดงสถานะข้อมูลไม่พร้อม)
8. รายงานประวัติการดำเนินการ — `/dashboard/reports/audit`

## การส่งออก
ระยะนี้รองรับ CSV และ browser print ซึ่งผู้ใช้สามารถเลือก Save as PDF ได้โดยไม่เพิ่ม dependency ใหม่ ระบบสามารถเปลี่ยนเป็น XLSX/PDF generator เฉพาะทางได้ใน phase ถัดไปเมื่อกำหนดรูปแบบเอกสารราชการ/โลโก้/หัวกระดาษอย่างเป็นทางการ

## แนวทาง UX
- กรองแบบชัดเจน มี label เสมอ
- ปุ่ม interactive สูงอย่างน้อย 44px
- ตารางห่อด้วย `overflow-x-auto` เพื่อรองรับจอแคบ
- ใช้ข้อความสถานะ ไม่พึ่งสีอย่างเดียว
- error ใช้ `role="alert"`
- ใช้ Lucide SVG icon ไม่ใช้ emoji
- พิมพ์เป็นเอกสารได้โดยซ่อน filter/action ด้วย `print:hidden`
