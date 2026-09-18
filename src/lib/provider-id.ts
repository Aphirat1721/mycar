import { encrypt, sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const hcode = process.env.ALLOWED_HCODE ?? "11061";
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const healthSecret = () => env("HEALTH_ID_CLIENT_SECRET");
const providerSecret = () => env("PROVIDER_ID_SECRET_KEY");

export function healthIdAuthorizationUrl(state: string) {
  const q = new URLSearchParams({
    client_id: env("HEALTH_ID_CLIENT_ID"),
    redirect_uri: env("HEALTH_ID_REDIRECT_URI"),
    response_type: "code",
    state,
  });
  return `${env("HEALTH_ID_BASE_URL")}/oauth/redirect?${q}`;
}

async function healthToken(code: string) {
  const response = await fetch(`${env("HEALTH_ID_BASE_URL")}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env("HEALTH_ID_REDIRECT_URI"),
      client_id: env("HEALTH_ID_CLIENT_ID"),
      client_secret: healthSecret(),
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data?.access_token) throw new Error("Health ID token exchange failed");
  return payload.data.access_token as string;
}

async function providerToken(healthTokenValue: string) {
  const response = await fetch(`${env("PROVIDER_ID_BASE_URL")}/api/v1/services/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env("PROVIDER_ID_CLIENT_ID"),
      secret_key: providerSecret(),
      token_by: "Health ID",
      token: healthTokenValue,
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data?.access_token) throw new Error("Provider ID token exchange failed");
  return payload.data.access_token as string;
}

function normalizeCid(value: unknown): string | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    const text = String(value);
    return /^\d{13}$/.test(text) ? text : /^\d{12}$/.test(text) ? text.padStart(13, "0") : null;
  }
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/[\s-]+/g, "");
  return /^\d{13}$/.test(text) ? text : /^\d{12}$/.test(text) ? text.padStart(13, "0") : null;
}

function findCid(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findCid(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return normalizeCid(value);
  const object = value as Record<string, unknown>;
  const direct = normalizeCid(object.cid);
  if (direct) return direct;
  for (const [name, child] of Object.entries(object)) {
    const lower = name.toLowerCase();
    if (name !== "cid" && name !== "hash_cid" && lower.includes("cid") && !lower.includes("hash")) {
      const candidate = normalizeCid(child);
      if (candidate) return candidate;
    }
    if (name !== "hash_cid") {
      const found = findCid(child);
      if (found) return found;
    }
  }
  return null;
}

function findHashCid(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHashCid(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  for (const [name, child] of Object.entries(value as Record<string, unknown>)) {
    if (name === "hash_cid" && typeof child === "string" && child.trim()) return child.trim();
    const found = findHashCid(child);
    if (found) return found;
  }
  return null;
}

export type ProviderProfile = {
  account_id: string;
  provider_id?: string | null;
  title_th?: string | null;
  firstname_th?: string | null;
  lastname_th?: string | null;
  name_th?: string | null;
  username?: string | null;
  cid?: string | null;
  hash_cid?: string | null;
  organization?: Array<{ hcode?: string | null; hname_th?: string | null; position?: string | null }>;
};

async function getProfile(token: string) {
  const url = new URL(`${env("PROVIDER_ID_BASE_URL")}/api/v1/services/profile`);
  url.searchParams.set("position_type", "1");
  url.searchParams.set("moph_idp_permission", "1");
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "client-id": env("PROVIDER_ID_CLIENT_ID"),
      "secret-key": providerSecret(),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== 200 || !payload?.data) throw new Error("Provider ID profile lookup failed");
  const profile = payload.data as ProviderProfile;
  const cid = findCid(profile);
  console.info("[Provider ID] profile structure", {
    keys: Object.keys(profile),
    hasCid: Boolean(cid),
    cidType: typeof profile.cid,
    cidLength: cid?.length ?? 0,
    hasHashCid: Boolean(profile.hash_cid ?? findHashCid(profile)),
  });
  return { ...profile, cid, hash_cid: profile.hash_cid ?? findHashCid(profile) };
}

export async function authenticateProviderCode(code: string) {
  const profile = await getProfile(await providerToken(await healthToken(code)));
  const organizations = (profile.organization ?? []).filter((item) => item.hcode);
  const organization = organizations.find((item) => item.hcode === hcode);
  if (!organization) throw new Error("HCODE_NOT_ALLOWED");

  const accountIdHash = sha256(profile.account_id);
  const cidHash = profile.cid ? sha256(profile.cid) : null;
  const cidCiphertext = profile.cid ? encrypt(profile.cid) : null;

  // Provider ID account_id is the primary login identity.
  // CID is stored as verified identity data, but MUST NOT be used to merge users.
  const existingUser = await prisma.user.findUnique({ where: { accountIdHash } });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          accountIdHash,
          accountIdCiphertext: encrypt(profile.account_id),
          providerIdHash: profile.provider_id ? sha256(profile.provider_id) : undefined,
          providerIdCiphertext: profile.provider_id ? encrypt(profile.provider_id) : undefined,
          cidHash: cidHash ?? undefined,
          cidCiphertext: cidCiphertext ?? undefined,
          titleTh: profile.title_th ?? null,
          firstnameTh: profile.firstname_th ?? null,
          lastnameTh: profile.lastname_th ?? null,
          nameTh: profile.name_th ?? null,
          position: organization.position ?? null,
          organizationHcode: organization.hcode ?? hcode,
          organizationName: organization.hname_th ?? null,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      })
    : await prisma.user.create({
        data: {
          accountIdHash,
          accountIdCiphertext: encrypt(profile.account_id),
          providerIdHash: profile.provider_id ? sha256(profile.provider_id) : null,
          providerIdCiphertext: profile.provider_id ? encrypt(profile.provider_id) : null,
          cidHash,
          cidCiphertext,
          titleTh: profile.title_th ?? null,
          firstnameTh: profile.firstname_th ?? null,
          lastnameTh: profile.lastname_th ?? null,
          nameTh: profile.name_th ?? null,
          position: organization.position ?? null,
          organizationHcode: organization.hcode ?? hcode,
          organizationName: organization.hname_th ?? null,
          lastLoginAt: new Date(),
        },
      });

  try {
    const existing = await prisma.userProviderIdentity.findUnique({
      where: { userId: user.id },
      select: { cidHash: true, cidCiphertext: true, firstCapturedAt: true },
    });
    await prisma.userProviderIdentity.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        providerAccountIdHash: accountIdHash,
        providerIdHash: profile.provider_id ? sha256(profile.provider_id) : null,
        cidHash,
        cidCiphertext,
        source: "PROVIDER_ID",
        firstCapturedAt: profile.cid ? new Date() : null,
        lastVerifiedAt: new Date(),
      },
      update: {
        providerAccountIdHash: accountIdHash,
        providerIdHash: profile.provider_id ? sha256(profile.provider_id) : undefined,
        cidHash: cidHash ?? existing?.cidHash ?? undefined,
        cidCiphertext: cidCiphertext ?? existing?.cidCiphertext ?? undefined,
        firstCapturedAt: existing?.firstCapturedAt ?? (profile.cid ? new Date() : null),
        lastVerifiedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("provider_identity_persist_failed", error instanceof Error ? error.message : "unknown");
  }

  for (const item of organizations) {
    const organizationRecord = await prisma.organization.upsert({
      where: { hcode: item.hcode! },
      create: { hcode: item.hcode!, nameTh: item.hname_th ?? item.hcode! },
      update: { nameTh: item.hname_th ?? item.hcode!, status: "ACTIVE" },
    });
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: organizationRecord.id } },
      create: { userId: user.id, organizationId: organizationRecord.id, position: item.position ?? null, isPrimary: item.hcode === hcode },
      update: { position: item.position ?? null, isPrimary: item.hcode === hcode },
    }).catch(() => undefined);
  }

  await ensureDefaultRole(user.id);
  return user;
}

async function ensureDefaultRole(userId: string) {
  const now = new Date();
  const application = await prisma.application.upsert({
    where: { code: "MYCAR" },
    create: { code: "MYCAR", nameTh: "ระบบขอใช้รถยนต์", description: "ระบบจัดการการขอใช้รถยนต์ โรงพยาบาลเกษตรวิสัย", iconKey: "car", basePath: "/dashboard", sortOrder: 10 },
    update: {},
  });
  const role = await prisma.role.upsert({
    where: { applicationId_key: { applicationId: application.id, key: "USER" } },
    create: { applicationId: application.id, key: "USER", nameTh: "ผู้ใช้งาน" },
    update: {},
  });
  await prisma.userRole.create({ data: { userId, roleId: role.id } }).catch(() => undefined);
  await prisma.userApplication.create({ data: { userId, applicationId: application.id, createdAt: now, updatedAt: now } }).catch(() => undefined);
  const meeting = await prisma.application.findUnique({ where: { code: "MEETING_ROOMS" }, select: { id: true } });
  if (meeting) await prisma.userApplication.create({ data: { userId, applicationId: meeting.id, createdAt: now, updatedAt: now } }).catch(() => undefined);

  await ensureSpecialRoles(userId);
}

export async function ensureSpecialRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nameTh: true, department: { select: { nameTh: true } } },
  });
  if (!user) return;

  const isSuperAdmin = user.nameTh?.trim() === "อภิรัฐ พิมพ์เขต";
  const isItCenter = user.department?.nameTh?.trim() === "ศูนย์คอมพิวเตอร์ (IT Center)";

  if (!isSuperAdmin && !isItCenter) return;

  const applications = await prisma.application.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const app of applications) {
    const roleKey = isSuperAdmin ? "SUPER_ADMIN" : "ADMIN";
    const roleName = isSuperAdmin ? "ผู้ดูแลระบบสูงสุด" : "ผู้ดูแลระบบ";
    const role = await prisma.role.upsert({
      where: { applicationId_key: { applicationId: app.id, key: roleKey } },
      create: { applicationId: app.id, key: roleKey, nameTh: roleName },
      update: {},
    });
    await prisma.userRole.create({ data: { userId, roleId: role.id } }).catch(() => undefined);
    await prisma.userApplication.create({
      data: { userId, applicationId: app.id, createdAt: new Date(), updatedAt: new Date() },
    }).catch(() => undefined);
  }
}
