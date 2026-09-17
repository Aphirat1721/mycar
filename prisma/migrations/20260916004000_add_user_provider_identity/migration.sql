CREATE TABLE "UserProviderIdentity" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "publicId" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "providerAccountIdHash" VARCHAR(64) NOT NULL,
  "providerIdHash" VARCHAR(64),
  "cidHash" VARCHAR(64),
  "cidCiphertext" TEXT,
  "source" VARCHAR(50) NOT NULL DEFAULT 'PROVIDER_ID',
  "firstCapturedAt" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProviderIdentity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserProviderIdentity_publicId_key" ON "UserProviderIdentity"("publicId");
CREATE UNIQUE INDEX "UserProviderIdentity_userId_key" ON "UserProviderIdentity"("userId");
CREATE UNIQUE INDEX "UserProviderIdentity_providerAccountIdHash_key" ON "UserProviderIdentity"("providerAccountIdHash");
CREATE UNIQUE INDEX "UserProviderIdentity_providerIdHash_key" ON "UserProviderIdentity"("providerIdHash");
CREATE UNIQUE INDEX "UserProviderIdentity_cidHash_key" ON "UserProviderIdentity"("cidHash");
CREATE INDEX "UserProviderIdentity_source_lastVerifiedAt_idx" ON "UserProviderIdentity"("source", "lastVerifiedAt");
ALTER TABLE "UserProviderIdentity" ADD CONSTRAINT "UserProviderIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "UserProviderIdentity" ("userId","providerAccountIdHash","providerIdHash","cidHash","cidCiphertext","source","firstCapturedAt","lastVerifiedAt","createdAt","updatedAt")
SELECT "id","accountIdHash","providerIdHash","cidHash","cidCiphertext",'PROVIDER_ID',CASE WHEN "cidCiphertext" IS NOT NULL THEN "createdAt" ELSE NULL END,CASE WHEN "cidCiphertext" IS NOT NULL THEN "lastLoginAt" ELSE NULL END,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "User";
