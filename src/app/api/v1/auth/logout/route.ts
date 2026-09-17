import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { destroySession, getCurrentUser } from "@/modules/identity/session";

export async function POST() {
  const user = await getCurrentUser();
  await destroySession();
  await audit({ userId: user?.id, action: "LOGOUT", resource: "AUTH", result: "SUCCESS" });
  return NextResponse.json({ ok: true });
}
