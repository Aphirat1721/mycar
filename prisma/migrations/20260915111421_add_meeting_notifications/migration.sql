-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'MOHP_NOTIFY');

-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('MEETING_BOOKING_CREATED', 'MEETING_BOOKING_UPDATED', 'MEETING_BOOKING_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE', 'DENIED');

-- CreateEnum
CREATE TYPE "MasterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('MANAGE_USERS', 'MANAGE_DRIVERS', 'MANAGE_VEHICLES', 'VIEW_AUDIT_LOG', 'MANAGE_DEPARTMENTS', 'MANAGE_VEHICLE_REQUESTS', 'MANAGE_DRIVER_EVALUATIONS', 'MANAGE_MEETING_ROOMS', 'MANAGE_MEETING_EQUIPMENT', 'MANAGE_MEETING_BOOKINGS', 'APPROVE_MEETING_BOOKINGS', 'VIEW_MEETING_REPORTS');

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER', 'VEHICLE_APPROVER', 'DRIVER_EVALUATION_REVIEWER', 'DRIVER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "MeetingBookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VehicleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'ASSIGNED', 'IN_PROGRESS');

-- CreateTable
CREATE TABLE "Application" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "nameTh" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "iconKey" VARCHAR(80),
    "basePath" VARCHAR(200),
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "resource" VARCHAR(120) NOT NULL,
    "resourceId" VARCHAR(120),
    "result" "AuditResult" NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "nameTh" VARCHAR(200) NOT NULL,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "photoPath" TEXT,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" UUID,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverEvaluation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleRequestId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "evaluatorId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" VARCHAR(255),
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hcode" VARCHAR(20) NOT NULL,
    "nameTh" VARCHAR(300) NOT NULL,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" "PermissionKey" NOT NULL,
    "nameTh" TEXT NOT NULL,
    "applicationId" UUID,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" "RoleKey" NOT NULL,
    "nameTh" TEXT NOT NULL,
    "applicationId" UUID,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountIdHash" VARCHAR(64) NOT NULL,
    "accountIdCiphertext" TEXT NOT NULL,
    "providerIdHash" VARCHAR(64),
    "providerIdCiphertext" TEXT,
    "titleTh" TEXT,
    "firstnameTh" TEXT,
    "lastnameTh" TEXT,
    "nameTh" TEXT,
    "position" TEXT,
    "organizationHcode" VARCHAR(20),
    "organizationName" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" UUID,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApplication" (
    "userId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApplication_pkey" PRIMARY KEY ("userId","applicationId")
);

-- CreateTable
CREATE TABLE "UserOrganization" (
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "position" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("userId","organizationId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "licensePlate" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "vehicleType" TEXT,
    "note" TEXT,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleFuelEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleUsageLogId" UUID NOT NULL,
    "fuelType" VARCHAR(100) NOT NULL,
    "liters" DECIMAL(10,2) NOT NULL,
    "pricePerLiter" DECIMAL(10,2),
    "amount" DECIMAL(12,2) NOT NULL,
    "receiptNo" VARCHAR(120),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleFuelEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" UUID NOT NULL,
    "departmentId" UUID,
    "vehicleId" UUID,
    "driverId" UUID,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3) NOT NULL,
    "destination" VARCHAR(500) NOT NULL,
    "purpose" VARCHAR(1000) NOT NULL,
    "passengerCount" INTEGER NOT NULL DEFAULT 1,
    "passengerNames" TEXT,
    "note" TEXT,
    "status" "VehicleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departureDate" DATE NOT NULL,
    "departureTime" TIME(6) NOT NULL,
    "returnDate" DATE NOT NULL,
    "returnTime" TIME(6) NOT NULL,

    CONSTRAINT "VehicleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleUsageExpense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleUsageLogId" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "detail" TEXT,
    "receiptNo" VARCHAR(120),
    "evidencePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleUsageExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleUsageLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vehicleRequestId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "actualDepartureAt" TIMESTAMP(3),
    "actualReturnAt" TIMESTAMP(3),
    "odometerStart" INTEGER NOT NULL,
    "odometerEnd" INTEGER,
    "preTripCheck" JSONB,
    "postTripCheck" JSONB,
    "hasIncident" BOOLEAN NOT NULL DEFAULT false,
    "incidentDetail" TEXT,
    "operationNote" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "nameTh" VARCHAR(200) NOT NULL,
    "location" VARCHAR(300),
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "description" VARCHAR(1000),
    "imagePath" TEXT,
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "departmentId" UUID,

    CONSTRAINT "MeetingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingEquipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "nameTh" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "status" "MasterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRoomEquipment" (
    "roomId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "MeetingRoomEquipment_pkey" PRIMARY KEY ("roomId","equipmentId")
);

-- CreateTable
CREATE TABLE "MeetingBooking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roomId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "departmentId" UUID,
    "title" VARCHAR(300) NOT NULL,
    "purpose" VARCHAR(1000),
    "attendeeCount" INTEGER NOT NULL DEFAULT 1,
    "attendeeNames" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "note" VARCHAR(2000),
    "status" "MeetingBookingStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" VARCHAR(1000),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingBookingEquipment" (
    "bookingId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MeetingBookingEquipment_pkey" PRIMARY KEY ("bookingId","equipmentId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientUserId" UUID NOT NULL,
    "applicationId" UUID,
    "meetingBookingId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "eventType" "NotificationEventType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" VARCHAR(1000),
    "providerMessageId" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_publicId_key" ON "Application"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_code_key" ON "Application"("code");

-- CreateIndex
CREATE INDEX "Application_status_sortOrder_idx" ON "Application"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_publicId_key" ON "AuditLog"("publicId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_createdAt_idx" ON "AuditLog"("resource", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Department_publicId_key" ON "Department"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_deletedAt_idx" ON "Department"("deletedAt");

-- CreateIndex
CREATE INDEX "Department_status_idx" ON "Department"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_publicId_key" ON "Driver"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE INDEX "Driver_deletedAt_idx" ON "Driver"("deletedAt");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DriverEvaluation_publicId_key" ON "DriverEvaluation"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverEvaluation_vehicleRequestId_key" ON "DriverEvaluation"("vehicleRequestId");

-- CreateIndex
CREATE INDEX "DriverEvaluation_acknowledgedAt_idx" ON "DriverEvaluation"("acknowledgedAt");

-- CreateIndex
CREATE INDEX "DriverEvaluation_driverId_createdAt_idx" ON "DriverEvaluation"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverEvaluation_evaluatorId_createdAt_idx" ON "DriverEvaluation"("evaluatorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_publicId_key" ON "Organization"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_hcode_key" ON "Organization"("hcode");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Permission_applicationId_idx" ON "Permission"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_applicationId_key_key" ON "Permission"("applicationId", "key");

-- CreateIndex
CREATE INDEX "Role_applicationId_idx" ON "Role"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_applicationId_key_key" ON "Role"("applicationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_accountIdHash_key" ON "User"("accountIdHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_providerIdHash_key" ON "User"("providerIdHash");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_organizationHcode_idx" ON "User"("organizationHcode");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "UserApplication_applicationId_idx" ON "UserApplication"("applicationId");

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "UserOrganization_userId_isPrimary_idx" ON "UserOrganization"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_publicId_key" ON "Vehicle"("publicId");

-- CreateIndex
CREATE INDEX "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleFuelEntry_publicId_key" ON "VehicleFuelEntry"("publicId");

-- CreateIndex
CREATE INDEX "VehicleFuelEntry_vehicleUsageLogId_idx" ON "VehicleFuelEntry"("vehicleUsageLogId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleRequest_publicId_key" ON "VehicleRequest"("publicId");

-- CreateIndex
CREATE INDEX "VehicleRequest_departmentId_departureAt_idx" ON "VehicleRequest"("departmentId", "departureAt");

-- CreateIndex
CREATE INDEX "VehicleRequest_departmentId_departureDate_idx" ON "VehicleRequest"("departmentId", "departureDate");

-- CreateIndex
CREATE INDEX "VehicleRequest_departureAt_idx" ON "VehicleRequest"("departureAt");

-- CreateIndex
CREATE INDEX "VehicleRequest_departureDate_idx" ON "VehicleRequest"("departureDate");

-- CreateIndex
CREATE INDEX "VehicleRequest_requesterId_departureAt_idx" ON "VehicleRequest"("requesterId", "departureAt");

-- CreateIndex
CREATE INDEX "VehicleRequest_requesterId_departureDate_idx" ON "VehicleRequest"("requesterId", "departureDate");

-- CreateIndex
CREATE INDEX "VehicleRequest_status_departureAt_idx" ON "VehicleRequest"("status", "departureAt");

-- CreateIndex
CREATE INDEX "VehicleRequest_status_departureDate_idx" ON "VehicleRequest"("status", "departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleUsageExpense_publicId_key" ON "VehicleUsageExpense"("publicId");

-- CreateIndex
CREATE INDEX "VehicleUsageExpense_vehicleUsageLogId_idx" ON "VehicleUsageExpense"("vehicleUsageLogId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleUsageLog_publicId_key" ON "VehicleUsageLog"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleUsageLog_vehicleRequestId_key" ON "VehicleUsageLog"("vehicleRequestId");

-- CreateIndex
CREATE INDEX "VehicleUsageLog_driverId_createdAt_idx" ON "VehicleUsageLog"("driverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRoom_publicId_key" ON "MeetingRoom"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingRoom_code_key" ON "MeetingRoom"("code");

-- CreateIndex
CREATE INDEX "MeetingRoom_status_idx" ON "MeetingRoom"("status");

-- CreateIndex
CREATE INDEX "MeetingRoom_departmentId_idx" ON "MeetingRoom"("departmentId");

-- CreateIndex
CREATE INDEX "MeetingRoom_deletedAt_idx" ON "MeetingRoom"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingEquipment_publicId_key" ON "MeetingEquipment"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingEquipment_code_key" ON "MeetingEquipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingBooking_publicId_key" ON "MeetingBooking"("publicId");

-- CreateIndex
CREATE INDEX "MeetingBooking_roomId_startAt_endAt_idx" ON "MeetingBooking"("roomId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "MeetingBooking_requesterId_startAt_idx" ON "MeetingBooking"("requesterId", "startAt");

-- CreateIndex
CREATE INDEX "MeetingBooking_departmentId_startAt_idx" ON "MeetingBooking"("departmentId", "startAt");

-- CreateIndex
CREATE INDEX "MeetingBooking_status_startAt_idx" ON "MeetingBooking"("status", "startAt");

-- CreateIndex
CREATE INDEX "MeetingBookingEquipment_equipmentId_idx" ON "MeetingBookingEquipment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_publicId_key" ON "Notification"("publicId");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_channel_eventType_createdAt_idx" ON "Notification"("channel", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_meetingBookingId_eventType_idx" ON "Notification"("meetingBookingId", "eventType");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEvaluation" ADD CONSTRAINT "DriverEvaluation_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEvaluation" ADD CONSTRAINT "DriverEvaluation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEvaluation" ADD CONSTRAINT "DriverEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEvaluation" ADD CONSTRAINT "DriverEvaluation_vehicleRequestId_fkey" FOREIGN KEY ("vehicleRequestId") REFERENCES "VehicleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApplication" ADD CONSTRAINT "UserApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApplication" ADD CONSTRAINT "UserApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleFuelEntry" ADD CONSTRAINT "VehicleFuelEntry_vehicleUsageLogId_fkey" FOREIGN KEY ("vehicleUsageLogId") REFERENCES "VehicleUsageLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRequest" ADD CONSTRAINT "VehicleRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRequest" ADD CONSTRAINT "VehicleRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRequest" ADD CONSTRAINT "VehicleRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRequest" ADD CONSTRAINT "VehicleRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleUsageExpense" ADD CONSTRAINT "VehicleUsageExpense_vehicleUsageLogId_fkey" FOREIGN KEY ("vehicleUsageLogId") REFERENCES "VehicleUsageLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleUsageLog" ADD CONSTRAINT "VehicleUsageLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleUsageLog" ADD CONSTRAINT "VehicleUsageLog_vehicleRequestId_fkey" FOREIGN KEY ("vehicleRequestId") REFERENCES "VehicleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRoom" ADD CONSTRAINT "MeetingRoom_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRoomEquipment" ADD CONSTRAINT "MeetingRoomEquipment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingRoomEquipment" ADD CONSTRAINT "MeetingRoomEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MeetingEquipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBooking" ADD CONSTRAINT "MeetingBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBooking" ADD CONSTRAINT "MeetingBooking_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBooking" ADD CONSTRAINT "MeetingBooking_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBooking" ADD CONSTRAINT "MeetingBooking_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBookingEquipment" ADD CONSTRAINT "MeetingBookingEquipment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "MeetingBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBookingEquipment" ADD CONSTRAINT "MeetingBookingEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MeetingEquipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_meetingBookingId_fkey" FOREIGN KEY ("meetingBookingId") REFERENCES "MeetingBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
