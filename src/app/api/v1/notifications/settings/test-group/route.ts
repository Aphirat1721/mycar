import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";
import { sendMophNotifyGroupTest } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await requireAdmin();
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 1000) return NextResponse.json({ error: "กรุณาระบุข้อความทดสอบไม่เกิน 1000 ตัวอักษร" }, { status: 400 });
  const result = await sendMophNotifyGroupTest(message);
  try {
    await import("@/lib/prisma").then(({ prisma }) => prisma.auditLog.create({ data: { userId: user.id, action: "TEST_MOPH_NOTIFY_GROUP", resource: "NOTIFICATION_SETTINGS", result: result.success ? "SUCCESS" : "FAILURE", metadata: { httpStatus: result.httpStatus, messageCode: result.messageCode, responseMessage: result.responseMessage, error: result.error } } }));
  } catch (error) {
    console.error("TEST_MOPH_NOTIFY_GROUP audit log failed", error);
  }
  if (!result.success) return NextResponse.json({ ok: false, error: result.error ?? "MOPH Notify ไม่ตอบรับ", httpStatus: result.httpStatus, messageCode: result.messageCode, responseMessage: result.responseMessage }, { status: 502 });
  return NextResponse.json({ ok: true, message: result.responseMessage ?? "ส่งข้อความทดสอบสำเร็จ", httpStatus: result.httpStatus, messageCode: result.messageCode });
}
