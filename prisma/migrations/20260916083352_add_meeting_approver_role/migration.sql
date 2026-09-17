-- AlterEnum
ALTER TYPE "RoleKey" ADD VALUE 'MEETING_APPROVER';

-- AlterTable
ALTER TABLE "UserProviderIdentity" ALTER COLUMN "updatedAt" DROP DEFAULT;
