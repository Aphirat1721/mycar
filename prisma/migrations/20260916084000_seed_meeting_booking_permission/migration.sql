-- Seed the meeting-room approval permission and its role assignment.
INSERT INTO "Permission" (id, key, "nameTh", "applicationId")
SELECT gen_random_uuid(), 'APPROVE_MEETING_BOOKINGS', 'อนุมัติและจัดการการจองห้องประชุม', a.id
FROM "Application" a
WHERE a.code = 'MEETING_ROOMS'
  AND NOT EXISTS (
    SELECT 1 FROM "Permission" p
    WHERE p.key = 'APPROVE_MEETING_BOOKINGS' AND p."applicationId" = a.id
  );

INSERT INTO "Role" (id, key, "nameTh", "applicationId")
SELECT gen_random_uuid(), 'MEETING_APPROVER', 'ผู้อนุมัติการจองห้องประชุม', a.id
FROM "Application" a
WHERE a.code = 'MEETING_ROOMS'
  AND NOT EXISTS (
    SELECT 1 FROM "Role" r
    WHERE r.key = 'MEETING_APPROVER' AND r."applicationId" = a.id
  );

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r
JOIN "Application" a ON a.id = r."applicationId" AND a.code = 'MEETING_ROOMS'
JOIN "Permission" p ON p."applicationId" = a.id AND p.key = 'APPROVE_MEETING_BOOKINGS'
WHERE r.key = 'MEETING_APPROVER'
  AND NOT EXISTS (
    SELECT 1 FROM "RolePermission" rp
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );
