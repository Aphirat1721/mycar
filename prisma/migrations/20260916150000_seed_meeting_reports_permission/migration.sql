-- Seed meeting-room reporting permission and grant it to the meeting approver role.
INSERT INTO "Permission" (id, key, "nameTh", "applicationId")
SELECT gen_random_uuid(), 'VIEW_MEETING_REPORTS', 'ดูรายงานระบบจองห้องประชุม', a.id
FROM "Application" a
WHERE a.code = 'MEETING_ROOMS'
  AND NOT EXISTS (SELECT 1 FROM "Permission" p WHERE p.key = 'VIEW_MEETING_REPORTS' AND p."applicationId" = a.id);

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r.id, p.id
FROM "Role" r
JOIN "Application" a ON a.id=r."applicationId" AND a.code='MEETING_ROOMS'
JOIN "Permission" p ON p."applicationId"=a.id AND p.key='VIEW_MEETING_REPORTS'
WHERE r.key='MEETING_APPROVER'
  AND NOT EXISTS (SELECT 1 FROM "RolePermission" rp WHERE rp."roleId"=r.id AND rp."permissionId"=p.id);
