import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateProviderCode } from "@/modules/identity/provider-id";
import { createSession } from "@/modules/identity/session";
import { audit } from "@/lib/audit";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("mycar_oauth_state")?.value;
  cookieStore.delete("mycar_oauth_state");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const publicOrigin = (process.env.APP_PUBLIC_URL ?? url.origin).replace(/\/$/, "");

  if (!code || !state || !savedState || state !== savedState) {
    await audit({ action: "LOGIN", resource: "AUTH", result: "DENIED", metadata: { reason: "invalid_oauth_state" } });
    return NextResponse.redirect(new URL(`${basePath}/login?error=state`, publicOrigin));
  }

  try {
    const user = await authenticateProviderCode(code);
    await createSession(user.id);
    await audit({ userId: user.id, action: "LOGIN", resource: "AUTH", result: "SUCCESS" });
    return NextResponse.redirect(new URL(`${basePath}/portal`, publicOrigin));
  } catch (error) {
    const reason = error instanceof Error && error.message === "HCODE_NOT_ALLOWED" ? "unauthorized" : "oauth";
    await audit({ action: "LOGIN", resource: "AUTH", result: "DENIED", metadata: { reason } });
    return NextResponse.redirect(new URL(`${basePath}/login?error=${reason}`, publicOrigin));
  }
}
