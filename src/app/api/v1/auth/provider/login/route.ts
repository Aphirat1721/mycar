import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { healthIdAuthorizationUrl } from "@/modules/identity/provider-id";

export async function GET() {
  const state = randomBytes(32).toString("base64url");
  const response = NextResponse.redirect(healthIdAuthorizationUrl(state));
  response.cookies.set("mycar_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
