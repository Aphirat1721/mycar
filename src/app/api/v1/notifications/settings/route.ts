import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const definitions = {
  MOPH_NOTIFY_BASE_URL: { labelTh: "MOPH Alert Base URL / Endpoint", isSecret: false, description: "ใส่ Base URL หรือ URL เต็ม /alert/v3.1/messages ได้" },
  MOPH_NOTIFY_CLIENT_KEY: { labelTh: "รายบุคคล client-key", isSecret: true, description: "client-key จาก CMS MOPH ALERTING สำหรับ API รายบุคคล" },
  MOPH_NOTIFY_SECRET_KEY: { labelTh: "รายบุคคล secret-key", isSecret: true, description: "secret-key จาก CMS MOPH ALERTING สำหรับ API รายบุคคล" },
  MOPH_NOTIFY_GROUP_BASE_URL: { labelTh: "MOPH Notify Group Base URL / Endpoint", isSecret: false, description: "ใส่ Base URL หรือ URL เต็ม /api/notify/send ได้" },
  MOPH_NOTIFY_GROUP_ENABLED: { labelTh: "เปิดส่ง LINE กลุ่ม", isSecret: false, description: "true = เปิดส่งเข้า LINE group chats; false = ปิด" },
  MOPH_NOTIFY_GROUP_CLIENT_KEY: { labelTh: "LINE กลุ่ม client-key", isSecret: true, description: "client-key จากเมนูหน่วยบริการใน CMS MOPH Notify สำหรับ API กลุ่ม (ต้องใช้ชุดของ MOPH Notify โดยเฉพาะ)" },
  MOPH_NOTIFY_GROUP_SECRET_KEY: { labelTh: "LINE กลุ่ม secret-key", isSecret: true, description: "secret-key จากเมนูหน่วยบริการใน CMS MOPH Notify สำหรับ API กลุ่ม (ต้องใช้ชุดของ MOPH Notify โดยเฉพาะ)" },
} as const;

type Key = keyof typeof definitions;

function validateValue(key: Key, value: string) {
  if ((key === "MOPH_NOTIFY_BASE_URL" || key === "MOPH_NOTIFY_GROUP_BASE_URL") && value) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return "MOPH Notify URL ต้องเป็น HTTP/HTTPS";
    } catch {
      return "MOPH Notify URL ไม่ถูกต้อง";
    }
  }
  if (key === "MOPH_NOTIFY_GROUP_ENABLED" && value && !["true", "false"].includes(value.toLowerCase())) {
    return "เปิดส่ง LINE กลุ่มต้องเป็น true หรือ false";
  }
  return null;
}

export async function GET() {
  await requireAdmin();
  const keys = Object.keys(definitions) as Key[];
  const rows = await prisma.notificationSetting.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return NextResponse.json({
    settings: keys.map((key) => ({
      key,
      ...definitions[key],
      configured: Boolean(byKey.get(key)?.value),
    })),
  });
}

export async function PUT(request: Request) {
  const user = await requireAdmin();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const entries: Array<{ key: Key; value: string }> = [];
  for (const key of Object.keys(definitions) as Key[]) {
    if (!(key in body)) continue;
    const raw = (body as Record<string, unknown>)[key];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") {
      return NextResponse.json({ error: `ค่าของ ${definitions[key].labelTh} ไม่ถูกต้อง` }, { status: 400 });
    }
    const value = String(raw).trim();
    const validationError = validateValue(key, value);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    entries.push({ key, value });
  }

  await prisma.$transaction(async (tx) => {
    for (const { key, value } of entries) {
      // Secret fields are write-only: an empty value means keep the existing secret.
      if (!value && definitions[key].isSecret) continue;
      await tx.notificationSetting.upsert({
        where: { key },
        create: {
          key,
          labelTh: definitions[key].labelTh,
          value: value || null,
          isSecret: definitions[key].isSecret,
          description: definitions[key].description,
        },
        update: {
          labelTh: definitions[key].labelTh,
          value: value || null,
          isSecret: definitions[key].isSecret,
          description: definitions[key].description,
        },
      });
    }

    if (entries.length > 0) {
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_NOTIFICATION_SETTINGS",
          resource: "NOTIFICATION_SETTINGS",
          result: "SUCCESS",
          metadata: { keys: entries.map(({ key }) => key) },
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
