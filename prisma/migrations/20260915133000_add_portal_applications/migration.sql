INSERT INTO "Application" (id, "publicId", code, "nameTh", description, "iconKey", "basePath", status, "sortOrder", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), gen_random_uuid(), 'DEPARTMENTS', 'จัดการแผนก', 'โมดูลกลางสำหรับจัดการข้อมูลแผนกขององค์กร', 'hospital', '/portal/departments', 'ACTIVE', 20, now(), now()),
  (gen_random_uuid(), gen_random_uuid(), 'MEETING_ROOMS', 'ระบบจองห้องประชุม', 'ตรวจสอบห้องว่าง ดูตาราง และจองห้องประชุม', 'calendar', '/portal/meeting-rooms', 'ACTIVE', 30, now(), now())
ON CONFLICT (code) DO NOTHING;

INSERT INTO "Role" (id, "key", "nameTh", "applicationId")
SELECT gen_random_uuid(), 'ADMIN', 'ผู้ดูแลระบบ', id
FROM "Application"
WHERE code = 'DEPARTMENTS'
  AND NOT EXISTS (
    SELECT 1 FROM "Role" r WHERE r.key = 'ADMIN' AND r."applicationId" = "Application".id
  );

INSERT INTO "Role" (id, "key", "nameTh", "applicationId")
SELECT gen_random_uuid(), 'USER', 'ผู้ใช้งาน', id
FROM "Application"
WHERE code = 'MEETING_ROOMS'
  AND NOT EXISTS (
    SELECT 1 FROM "Role" r WHERE r.key = 'USER' AND r."applicationId" = "Application".id
  );

INSERT INTO "Role" (id, "key", "nameTh", "applicationId")
SELECT gen_random_uuid(), 'ADMIN', 'ผู้ดูแลระบบ', id
FROM "Application"
WHERE code = 'MEETING_ROOMS'
  AND NOT EXISTS (
    SELECT 1 FROM "Role" r WHERE r.key = 'ADMIN' AND r."applicationId" = "Application".id
  );
