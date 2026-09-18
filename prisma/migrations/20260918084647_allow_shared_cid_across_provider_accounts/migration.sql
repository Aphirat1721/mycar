-- DropIndex
DROP INDEX "MeetingBooking_preparedById_idx";

-- DropIndex
DROP INDEX "User_cidHash_key";

-- DropIndex
DROP INDEX "UserProviderIdentity_cidHash_key";

-- CreateIndex
CREATE INDEX "User_cidHash_idx" ON "User"("cidHash");

-- CreateIndex
CREATE INDEX "UserProviderIdentity_cidHash_idx" ON "UserProviderIdentity"("cidHash");
