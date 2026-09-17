import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/identity/session";
import { prisma } from "@/lib/prisma";
import { MeetingEvaluationIssue } from "@/generated/prisma";

const fields = ["equipmentReadiness","cleanliness","facilitationConvenience","roomSuitability","overallRating"] as const;
const validRating = (v: unknown) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 5;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json();
    const bookingPublicId = String(body.bookingId || "").trim();
    if (!bookingPublicId || fields.some((f) => !validRating(body[f]))) {
      return NextResponse.json({ error: "กรุณาให้คะแนนทุกหัวข้อ 1-5 ดาว" }, { status: 400 });
    }
    const booking = await prisma.meetingBooking.findUnique({
      where: { publicId: bookingPublicId },
      select: { id: true, publicId: true, requesterId: true, status: true },
    });
    if (!booking) return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
    if (booking.requesterId !== user.id) return NextResponse.json({ error: "ไม่มีสิทธิ์ประเมินรายการนี้" }, { status: 403 });
    if (booking.status !== "COMPLETED") return NextResponse.json({ error: "ประเมินได้หลังเสร็จสิ้นการใช้ห้องประชุมเท่านั้น" }, { status: 409 });

    const existing = await prisma.meetingBookingEvaluation.findUnique({
      where: { bookingId: booking.id },
      select: { evaluatorId: true },
    });
    if (existing && existing.evaluatorId !== user.id) return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขแบบประเมินนี้" }, { status: 403 });

    const issueCategory = body.issueCategory && Object.values(MeetingEvaluationIssue).includes(String(body.issueCategory) as MeetingEvaluationIssue)
      ? String(body.issueCategory) as MeetingEvaluationIssue
      : null;
    const evaluation = await prisma.meetingBookingEvaluation.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id, evaluatorId: user.id,
        equipmentReadiness: Number(body.equipmentReadiness), cleanliness: Number(body.cleanliness),
        facilitationConvenience: Number(body.facilitationConvenience), roomSuitability: Number(body.roomSuitability),
        overallRating: Number(body.overallRating), issueCategory,
        issueDetail: body.issueDetail ? String(body.issueDetail).trim() : null,
        comment: body.comment ? String(body.comment).trim() : null,
      },
      update: {
        evaluatorId: user.id, equipmentReadiness: Number(body.equipmentReadiness), cleanliness: Number(body.cleanliness),
        facilitationConvenience: Number(body.facilitationConvenience), roomSuitability: Number(body.roomSuitability),
        overallRating: Number(body.overallRating), issueCategory,
        issueDetail: body.issueDetail ? String(body.issueDetail).trim() : null,
        comment: body.comment ? String(body.comment).trim() : null,
      },
    });

    // Audit failure must not make a successfully saved evaluation look like a failed save.
    try {
      await prisma.auditLog.create({ data: { userId: user.id, action: "SUBMIT_MEETING_EVALUATION", resource: "MEETING_BOOKING_EVALUATION", resourceId: evaluation.publicId, result: "SUCCESS", metadata: { bookingId: booking.publicId } } });
    } catch (auditError) {
      console.error("SUBMIT_MEETING_EVALUATION audit log failed", auditError);
    }

    return NextResponse.json({ evaluation: { publicId: evaluation.publicId } }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("SUBMIT_MEETING_EVALUATION failed", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกการประเมินได้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
