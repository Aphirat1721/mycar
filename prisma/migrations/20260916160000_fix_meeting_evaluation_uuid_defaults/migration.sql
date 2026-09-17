-- Fix UUID defaults required by Prisma for meeting evaluation create/upsert.
ALTER TABLE "MeetingBookingEvaluation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "MeetingBookingEvaluation" ALTER COLUMN "publicId" SET DEFAULT gen_random_uuid();
