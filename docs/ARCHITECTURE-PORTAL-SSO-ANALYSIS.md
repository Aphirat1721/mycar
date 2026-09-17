# MyCar → Hospital Portal + SSO Architecture Analysis

วันที่วิเคราะห์: 2026-08-22
สถานะ: Analysis / Design only — ยังไม่แก้ source code และยังไม่เปลี่ยน database

## 1. Decision Summary

ระบบ MyCar ปัจจุบันเป็น Modular Monolith ที่มี Authentication/Session/Authorization อยู่ภายใน MyCar โดยตรง แต่โครงสร้างปัจจุบันสามารถต่อยอดเป็น Hospital Portal ได้โดยไม่ต้องรื้อระบบทั้งหมด หากแยก **Global Identity / Portal** ออกจาก **Application Domain (MyCar)** แบบ incremental

เป้าหมายระยะยาว:

Hospital Portal
→ Health ID / Provider ID authentication
→ Global Identity + Session
→ Application access / application roles
→ MyCar และ applications อื่นในอนาคต

หลักสำคัญ: MyCar ไม่ควรเป็น Identity Provider ของทุก application และแต่ละ application ไม่ควร implement Provider ID OAuth ซ้ำเอง

## 2. Current Architecture จาก Code จริง

### Runtime / application
- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- REST API versioned `/api/v1`
- Server-side session ด้วย HttpOnly cookie
- Provider ID integration อยู่ server-side

### Current route structure
- `/login` — หน้า login ปัจจุบัน
- `/api/v1/auth/provider/login` — เริ่ม OAuth
- `/api/v1/auth/provider/callback` — OAuth callback และสร้าง application session
- `/api/v1/auth/logout` — logout
- `/dashboard` — application dashboard
- MyCar domain routes เช่น users, drivers, vehicles, departments, vehicle-requests, approval, audit

### Current home behavior
`src/app/page.tsx` ตรวจ session แล้ว redirect:
- authenticated → `/dashboard`
- unauthenticated → `/login`

ดังนั้นหน้าแรกปัจจุบันยังเป็น entry point ของ MyCar โดยตรง ยังไม่มี Portal/Application Launcher

## 3. Current Provider ID Flow

`src/lib/provider-id.ts` ทำ flow server-side ดังนี้:

1. สร้าง Health ID authorization URL
2. แลก authorization code ที่ Health ID `/api/v1/token`
3. ใช้ Health ID access token ขอ Provider ID token ที่ `/api/v1/services/token`
4. ใช้ Provider token ขอ profile ที่ `/api/v1/services/profile`
5. เลือก organization รายการแรกที่ `hcode` ตรงกับ `ALLOWED_HCODE` (default `11061`)
6. ถ้าไม่พบ organization ที่อนุญาต จะ throw `HCODE_NOT_ALLOWED`
7. upsert User ด้วย accountIdHash
8. สร้าง default `USER` role ถ้ายังไม่มี role

Credentials อยู่ใน environment variables และ token ไม่ถูกเก็บใน browser จาก code ที่ตรวจสอบ

หมายเหตุ: code ปัจจุบันใช้ข้อมูล organization เพียงรายการที่ match hcode 11061 มาเป็นค่า `organizationHcode`, `organizationName`, `position` ของ User และยังไม่ได้มีตาราง Organization/UserOrganization จริง

## 4. Current Session

`src/lib/session.ts`:
- cookie ชื่อ `mycar_session`
- random opaque token
- เก็บเฉพาะ SHA-256 token hash ใน Session table
- HttpOnly
- Secure ใน production
- SameSite=lax
- inactivity timeout configurable ผ่าน `SESSION_IDLE_MINUTES`, default 30 นาที
- logout ทำการ revoke session

Session ผูกตรงกับ `User` และเป็น application session ของ MyCar ในปัจจุบัน

## 5. Current Database

### Identity / authorization tables
- `User`
- `Session`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`

### MyCar/domain tables
- `Driver`
- `Vehicle`
- `Department`
- `VehicleRequest`
- `AuditLog`

### Current User coupling
`User` มี field โดยตรง:
- accountIdHash / accountIdCiphertext
- providerIdHash / providerIdCiphertext
- personal name fields
- position
- organizationHcode
- organizationName
- departmentId
- status

ดังนั้น User ปัจจุบันเป็นทั้ง identity record และเก็บ snapshot ของ organization context ไว้ในตัวเอง

### Current authorization coupling
`Role` และ `Permission` เป็น global tables และยังไม่มี `Application` scope

`UserRole` → `Role`
`RolePermission` → `Permission`

จึงยังไม่มีวิธี native ที่ชัดเจนในการบอกว่า role/permission นี้เป็นของ MyCar หรือ Application อื่น

## 6. Main Coupling / Risks

1. OAuth entry/callback และ session cookie ใช้ชื่อ `mycar_*` และอยู่ใน MyCar route
2. `User` เก็บ organization เป็น scalar snapshot แทน normalized Organization + UserOrganization
3. Role/Permission ยังไม่ scoped ต่อ Application
4. Home route redirect ไป MyCar dashboard โดยตรง
5. Default role assignment อยู่ใน Provider authentication function
6. Application access ยังไม่มี registry กลาง
7. Session cookie เป็น MyCar-specific naming และ architecture
8. Provider authentication function ทำทั้ง external authentication, organization authorization, user persistence และ default role assignment ใน function เดียว

สิ่งเหล่านี้ควร refactor แบบ incremental ไม่ควร rewrite พร้อมกัน

## 7. Target Architecture

### Layer 1 — Hospital Portal
หน้าหลักของระบบโรงพยาบาล ทำหน้าที่เป็น application launcher และ entry point

### Layer 2 — Global Identity / Authentication
รับผิดชอบ:
- Health ID OAuth
- Provider ID exchange
- Provider Profile
- hcode authorization
- User identity persistence
- session
- logout

### Layer 3 — Portal / Application Registry
รับผิดชอบ:
- Application catalog
- application status
- application metadata/icon/URL
- user application access หรือ derive access จาก application-scoped roles

### Layer 4 — Application Domains
เช่น:
- MyCar
- Inventory (future)
- Meeting (future)

MyCar ยังคงเป็น Modular Monolith domain ภายในระบบเดิมในระยะแรก ไม่จำเป็นต้องแตก microservice

## 8. Target Identity Model

เสนอ Entity ระยะเป้าหมาย:

- `User` — global identity
- `Organization` — master organization
- `UserOrganization` — ความสัมพันธ์ user ↔ organization และ context เช่น position
- `Session` — global portal/application session
- `Application` — registry ของระบบ
- `Role` — role ที่มี scope เป็น global หรือ application
- `Permission` — permission ที่มี scope เป็น global หรือ application
- `UserRole` — user ↔ role
- `RolePermission` — role ↔ permission

แนวทาง migration ที่ปลอดภัยคือเพิ่ม `Application` และเพิ่ม optional application scope ให้ Role/Permission ก่อน โดยรักษา role/permission เดิมไว้เป็น legacy/global หรือผูกกับ MYCAR ตาม phase ที่กำหนดภายหลัง

ไม่ควรเริ่มด้วยการ rename/drop role/permission เดิม

## 9. Organization Normalization

Target:

User
  └── UserOrganization ── Organization

Organization อย่างน้อยควรมี:
- id
- publicId
- hcode
- nameTh
- status
- createdAt
- updatedAt

UserOrganization อย่างน้อยควรมี:
- userId
- organizationId
- position
- isPrimary (ถ้าต้องการ)
- createdAt / updatedAt

ข้อมูล `organizationHcode` และ `organizationName` ที่อยู่ใน User ปัจจุบันควรยังคงไว้ชั่วคราวในช่วง migration เพื่อ backward compatibility แล้วจึง deprecate ภายหลังเมื่อทุก consumer เปลี่ยนไปใช้ relation แล้ว

## 10. Application Registry

Target `Application`:
- id
- publicId
- code (เช่น MYCAR)
- nameTh
- description
- icon/key
- baseUrl/path
- status
- sortOrder
- createdAt
- updatedAt

การเปิด application ให้ user ควรทำได้โดย application-scoped role หรือ explicit access table ตาม policy ที่กำหนดใน phase implementation

## 11. Authorization Target

ต้องแยก:

Global Identity
กับ
Application Authorization

ตัวอย่าง:

User A
- MyCar → VEHICLE_ADMIN
- Inventory → INVENTORY_USER
- Meeting → USER

ควรหลีกเลี่ยง role key แบบ global unique ที่ทำให้ทุก application ต้องแชร์ namespace เดียวกัน หาก target design ใช้ application-scoped roles ให้เปลี่ยน uniqueness เป็นระดับ `(applicationId, key)` อย่างระมัดระวังและ incremental

## 12. Provider ID Authorization Rule

Core invariant:

ผู้ใช้สามารถสร้าง application session ได้ก็ต่อเมื่อ Provider Profile มีอย่างน้อยหนึ่ง `organization[].hcode === "11061"`

จุดตรวจสอบควรอยู่ใน Identity/Authorization layer ฝั่ง server ไม่ใช่ frontend และไม่ควรให้ MyCar เป็นผู้ตัดสินกฎนี้แต่เพียงระบบเดียว

หมายเหตุ: Provider Profile ตาม requirement/คู่มือสามารถมีหลาย organization ดังนั้นห้ามเปลี่ยนเป็นการตรวจ organization แรกเพียงรายการเดียวโดยไม่มีเหตุผล

## 13. Authentication Migration

Current:

MyCar Login
→ Provider ID
→ MyCar Session
→ MyCar Dashboard

Target:

Hospital Portal Login
→ Provider ID
→ Global Identity
→ Portal Session
→ Application Launcher
→ MyCar

Migration strategy:

### Phase 0 — Baseline
- ห้ามแก้ behavior
- document current architecture
- add tests/acceptance checks where needed

### Phase 1 — Add Portal concepts
- เพิ่ม Application registry schema/model
- เพิ่ม application scope design ให้ authorization แบบ backward compatible
- เพิ่ม Organization/UserOrganization โดยยังคง current User fields
- seed/define MYCAR application

### Phase 2 — Extract Identity services
- แยก Provider authentication logic ออกจาก MyCar domain
- ทำ identity service/module กลาง
- รักษา existing endpoints/flow ไว้ชั่วคราวเป็น compatibility layer

### Phase 3 — Session compatibility
- ออกแบบ portal session naming/claims/context
- ไม่ invalidate existing sessions โดยไม่จำเป็น
- รองรับการเปลี่ยน cookie แบบ overlap/dual-read ในช่วง migration ถ้าจำเป็น

### Phase 4 — Portal entry point
- เปลี่ยน home/entry behavior เป็น Portal อย่างค่อยเป็นค่อยไป
- authenticated user เห็น Application Launcher
- MyCar เป็น application tile/route
- existing direct MyCar URLs ยังทำงานได้

### Phase 5 — Authorization migration
- migrate role/permission mapping
- verify every MyCar API still enforces server-side authorization
- remove old paths only after verification

### Phase 6 — Cleanup
- deprecate old MyCar-only auth naming/fields after all consumers are migrated
- ห้าม cleanup จนกว่าจะมี evidence ว่าไม่มี consumer เดิมใช้งาน

## 14. Rollback Principle

ทุก phase ต้องสามารถ rollback โดยไม่ทำลายข้อมูลหลัก

หลัก:
Add → Migrate → Verify → Switch → Cleanup

ไม่ใช้:
Delete → Rewrite → Hope

Database migration ต้อง additive/backward compatible เป็นหลัก

## 15. UI/UX Target

หน้าแรกในอนาคตควรเป็น Hospital Portal ไม่ใช่ MyCar dashboard

Flow:

Landing / Portal
→ Login with Provider ID
→ Application Launcher

ตัวอย่าง tile:
- 🚗 ระบบขอใช้รถยนต์
- 📦 ระบบคลัง (future)
- 📅 ระบบจองห้องประชุม (future)

ต้องยังสามารถเข้า MyCar โดยตรงด้วย URL เดิมในช่วง transition เพื่อไม่กระทบ bookmark/operation เดิม

## 16. Recommended Folder Architecture

ระยะ Phase 1 แนะนำ Modular Monolith:

src/
├── app/
│   ├── api/v1/
│   │   ├── auth/
│   │   ├── portal/
│   │   └── mycar/
│   ├── portal/
│   ├── login/
│   └── dashboard/          # legacy/compatibility during migration
├── modules/
│   ├── identity/
│   │   ├── provider-id/
│   │   ├── session/
│   │   └── users/
│   ├── portal/
│   │   ├── applications/
│   │   └── authorization/
│   └── mycar/
│       ├── drivers/
│       ├── vehicles/
│       ├── departments/
│       └── vehicle-requests/
└── lib/

ไม่จำเป็นต้องย้ายทุกไฟล์ทันที การย้ายควรทำตาม dependency และแต่ละ phase ต้องรักษา imports/route compatibility

## 17. What NOT to Change Yet

- ห้ามลบ User fields ปัจจุบัน
- ห้ามลบ Role/Permission เดิม
- ห้ามเปลี่ยน session cookie แบบทันที
- ห้ามเปลี่ยน Provider ID endpoints โดยไม่มีเหตุผล
- ห้ามสร้าง microservices เพียงเพื่อรองรับหลาย application
- ห้ามแยก PostgreSQL database ต่อ application ใน Phase 1
- ห้ามทำ UI Portal ก่อน target auth/data model ได้รับการยืนยัน
- ห้าม implement future domains เช่น Inventory/Meeting เพียงเพื่อทำ demo

## 18. Immediate Next Step

ก่อนแก้ source code ให้ตรวจสอบและยืนยัน:
1. target Prisma schema ที่ additive และ backward compatible
2. Application/Role/Permission scoping strategy
3. Organization normalization strategy
4. session migration strategy
5. Portal route/launcher strategy
6. test/rollback criteria

หลังจากผู้พัฒนาอนุมัติ design แล้วจึงออก implementation prompt แยกเป็น phase และทำทีละ phase

## 19. Acceptance Criteria

- Login ครั้งเดียวสามารถเป็น identity กลางสำหรับหลาย application ได้
- Provider ID validation อยู่ใน server-side identity layer
- `hcode=11061` เป็น core access invariant
- User identity ไม่ผูกกับ MyCar domain
- MyCar เป็น application หนึ่งของ Portal
- Application ใหม่เพิ่มได้โดยไม่ต้อง rewrite authentication
- Database migration ไม่ทำลายข้อมูล/consumer เดิม
- Existing MyCar direct access ยังทำงานระหว่าง migration
- ทุก MyCar API ยังตรวจ authorization ที่ server
- Rollback ของแต่ละ phase ทำได้โดยไม่ลบข้อมูลหลัก


## 20. Phase 1 Implementation Status — 2026-08-22

สถานะ: Implemented locally; ยังไม่เปิด Production

### Implemented
- Added Application registry with MYCAR seed record.
- Added Organization and UserOrganization normalization tables.
- Added optional application scope to Role and Permission with composite uniqueness.
- Backfilled existing Role/Permission records to MYCAR application.
- Backfilled existing User organization snapshot into Organization/UserOrganization without removing legacy User fields.
- Updated Provider authentication to synchronize all Provider Profile organizations into the normalized model while retaining hcode 11061 as the access invariant and primary organization context.
- Updated default USER role creation to be scoped to MYCAR.
- Updated user-role administration lookup to resolve MYCAR-scoped roles.
- Applied migration 20260822130000_add_portal_identity_foundation successfully.
- Regenerated Prisma Client and ran seed successfully.

### Compatibility
- Existing MyCar routes and session cookie remain unchanged.
- Existing User organization fields remain for backward compatibility.
- Existing MyCar direct entry still redirects to the current dashboard/login flow.
- No Portal UI/SSO launcher switch has been performed yet.

### Verification
- Prisma schema validation: PASS
- TypeScript `tsc --noEmit`: PASS
- Production `next build`: PASS
- Changed-file ESLint: PASS
- Prisma migration status: UP TO DATE
- Full-project ESLint: existing unrelated errors remain in `scripts/patch-schema.cjs`, `src/app/dashboard/page.tsx`, and `src/components/vehicle-request-approval-list.tsx`; not introduced by this phase.

### Next safe phase
1. Introduce a dedicated identity/portal module boundary without changing runtime behavior.
2. Add Portal application catalog read path and tests.
3. Add application-aware authorization helpers.
4. Add Portal launcher UI while preserving direct MyCar URLs.
5. Only after verification, migrate session naming/entry point if required.
