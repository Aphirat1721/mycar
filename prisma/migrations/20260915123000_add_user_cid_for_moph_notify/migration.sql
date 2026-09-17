-- Store the user's CID securely so MOPH Alert can address the authenticated user by CID.
ALTER TABLE "User" ADD COLUMN "cidHash" VARCHAR(64);
ALTER TABLE "User" ADD COLUMN "cidCiphertext" TEXT;
CREATE UNIQUE INDEX "User_cidHash_key" ON "User"("cidHash");
