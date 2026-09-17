import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE = "mycar_session";
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES ?? 30);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDLE_MINUTES * 60_000);
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip");
  const userAgent = headerStore.get("user-agent");

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      lastActivityAt: now,
      expiresAt,
      ipAddress: ip,
      userAgent,
    },
  });

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  store.delete(COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roles: { include: { role: true } } } } },
  });

  if (!session || session.revokedAt || session.user.status !== "ACTIVE") {
    return null;
  }

  const now = Date.now();
  const idleMs = now - session.lastActivityAt.getTime();
  const maxMs = IDLE_MINUTES * 60_000;
  if (idleMs >= maxMs || session.expiresAt.getTime() <= now) {
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }

  const nextExpiry = new Date(now + maxMs);
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date(now), expiresAt: nextExpiry },
  });

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function hasRole(user: Awaited<ReturnType<typeof getCurrentUser>>, role: string) {
  return Boolean(user?.roles.some((item) => item.role.key === role));
}
