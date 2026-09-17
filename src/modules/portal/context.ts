import { getCurrentUser } from "@/modules/identity/session";
import { getApplicationByCode, getUserApplications, type PortalApplication } from "@/modules/portal/applications";

export type PortalContext = {
  userId: string;
  applications: PortalApplication[];
};

export async function getPortalContext(): Promise<PortalContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  return {
    userId: user.id,
    applications: await getUserApplications(user.id),
  };
}

export async function getUserApplicationContext(userId: string, code: string) {
  const applications = await getUserApplications(userId);
  return applications.find((application) => application.code === code) ?? null;
}

export async function getApplicationContext(code: string) {
  return getApplicationByCode(code);
}
