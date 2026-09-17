# ระบบขอใช้รถยนต์ โรงพยาบาลเกษตรวิสัย — Project Requirements

## Scope: Phase 1

ระบบ Web Application สำหรับบุคลากรโรงพยาบาลเกษตรวิสัย เพื่อเป็นฐานสำหรับระบบขอใช้รถยนต์ในระยะถัดไป

### 1. Access Control
- เฉพาะเจ้าหน้าที่ของโรงพยาบาลเกษตรวิสัยเท่านั้นที่มีสิทธิใช้งาน
- Authentication ใช้ Provider ID ผ่าน OAuth ของ Health ID
- อนุญาตเฉพาะผู้ที่มีรหัสหน่วยบริการ `11061`
- การตรวจสอบ `11061` ต้องทำที่ Backend/Authorization layer ไม่พึ่ง Frontend เพียงอย่างเดียว
- Provider Profile อาจมีหลาย organization; ต้องอนุญาตเมื่อมี organization อย่างน้อยหนึ่งรายการที่ `hcode = 11061`
- Provider ID/Health ID client credentials ต้องอยู่ฝั่ง server เท่านั้น

### 2. Authentication Flow
อ้างอิงคู่มือ Provider ID ด้วย OAuth ของ Health ID ที่แนบในโปรเจกต์

1. Web Application ส่งผู้ใช้ไป Health ID OAuth authorization endpoint
2. Health ID redirect กลับ Redirect URI พร้อม authorization `code`
3. Backend แลก `code` กับ Health ID Access Token ที่ `/api/v1/token`
4. Backend ใช้ Health ID Access Token ขอ Provider ID Access Token ที่ `/api/v1/services/token`
5. Backend เรียก Provider Profile ที่ `/api/v1/services/profile`
6. ตรวจสอบ `organization[].hcode === 11061`
7. สำเร็จแล้วสร้าง application session ของระบบเอง
8. ไม่เก็บ Provider/Health ID access token ใน browser localStorage

### 3. Session
- Application session ใช้ secure server-side/session-cookie approach
- Cookie ต้องเป็น HttpOnly, Secure ใน production และมี SameSite ที่เหมาะสม
- หากไม่มี activity 30 นาที ให้ session หมดอายุ/ตัด session
- Logout ต้อง invalidate session

### 4. User Management
- ต้องมี user/application identity ในฐานข้อมูลเพื่อผูกสิทธิ์กับ Provider ID
- `super_admin` สามารถกำหนดสิทธิ์ให้ user แต่ละคนได้
- ออกแบบ Authorization เป็น RBAC และเผื่อการเพิ่ม role/permission ในอนาคต
- ข้อมูลสิทธิ์จาก Provider (`is_hr_admin`, `is_director`) ไม่ถือเป็น application role โดยอัตโนมัติ เว้นแต่มี requirement เพิ่มเติม

### 5. Master Data: Drivers
ต้องสามารถจัดการพนักงานขับรถได้อย่างน้อย:
- ชื่อ
- นามสกุล
- ชื่อเล่น
- รูปถ่าย
- สถานะ Active / Inactive

ควรใช้ soft delete เพื่อรักษาความสัมพันธ์กับประวัติในอนาคต

### 6. Master Data: Vehicles
ต้องสามารถเพิ่ม/แก้ไข/จัดการข้อมูลรถยนต์ และมีสถานะ Active / Inactive

Field รายละเอียดรถยนต์ยังเปิดไว้ตาม requirement ปัจจุบัน จึงต้องออกแบบให้ขยายได้โดยไม่กระทบข้อมูลหลัก

### 7. Audit Log
- เก็บ log ทุกกิจกรรมที่สำคัญของระบบ
- อย่างน้อยครอบคลุม login success/failure, logout, authorization denial, CRUD master data, role/permission changes และ security-related events
- Log ต้องไม่บันทึก access token, client secret, secret key หรือข้อมูลลับโดยตรง
- ควรเก็บ actor, action, resource, resource id (ถ้ามี), result, timestamp, IP/user-agent ตามความเหมาะสม

### 8. Security
- ป้องกัน SQL injection ด้วย parameterized query/ORM
- Validate และ sanitize input ตามบริบท
- ป้องกัน XSS, CSRF, session fixation/hijacking, broken access control และ unsafe file upload ตามความเหมาะสม
- จำกัดชนิด/ขนาดไฟล์รูปภาพ
- Secrets ต้องมาจาก environment variables/secret store และไม่ commit ลง source control
- ใช้ secure headers และ HTTPS ใน production
- Authorization ต้องตรวจที่ server/API ทุก endpoint ที่มีสิทธิ์

### 9. ID Protection
- เลข ID ที่จัดเก็บในฐานข้อมูลต้องไม่เปิดเผยเป็น plain identifier ต่อผู้ใช้โดยไม่จำเป็น
- ออกแบบ public identifier/opaque identifier สำหรับ API และ URL
- หาก requirement หมายถึงการเข้ารหัส identifier ที่ database layer ให้แยกจาก primary key ภายใน และห้ามทำให้ foreign-key/queryability เสียโดยไม่จำเป็น

### 10. HL7
- ระบบต้องคำนึงถึง interoperability และข้อกำหนด HL7 ที่เกี่ยวข้องกับข้อมูลสุขภาพ/การเชื่อมต่อในอนาคต
- Requirement นี้ยังไม่ได้ระบุ HL7 version/profile/interface ที่ต้อง implement ใน Phase 1 จึงห้ามอ้างว่าแอปได้รับ HL7 certification
- โครงสร้าง domain/API ต้องไม่ปิดกั้นการเพิ่ม HL7/FHIR integration ภายหลัง

### 11. UI/UX
- Login page ต้องสวยงาม ทันสมัย และใช้งานง่าย โดยยึดแนวทาง UI/UX Pro Max
- รองรับ mobile/desktop
- ใช้ภาษาไทยเป็นหลัก
- ต้องมี loading, error, unauthorized และ empty states ที่ชัดเจน
- Visual direction: modern healthcare / trustworthy / clean / accessible

### 12. Architecture
- Full-stack application
- แนะนำ Modular Monolith ใน Phase 1
- Frontend/Backend ใช้ TypeScript ecosystem
- PostgreSQL เป็น relational database
- ORM ใช้ Prisma หรือเทียบเท่าที่มี parameterized queries
- File storage แยกจาก database สำหรับรูปภาพ
- API versioning ใช้ `/api/v1`
- รองรับ UAT/PRD ผ่าน environment configuration

### 13. Future-proofing
Phase 1 ยังไม่ต้อง implement workflow ขอใช้รถยนต์ทั้งหมด แต่ architecture ต้องรองรับภายหลังอย่างน้อย:
- vehicle request
- approval
- driver/vehicle assignment
- schedule/trip
- mileage/usage history
- reports

## Source of Truth
- Functional requirements: `docs/REQUIREMENTS.md`
- Provider ID integration: เอกสารคู่มือ Provider ID ด้วย OAuth ของ Health ID ที่แนบในโปรเจกต์
- หาก requirement ใหม่ขัดกับ source เดิม ให้ยึด requirement ล่าสุดของโปรเจกต์และบันทึก decision ให้ชัดเจน
