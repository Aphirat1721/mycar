import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";
import { hasApplicationRole, hasPermission } from "@/lib/authorization";
import MeetingReports from "@/components/meeting-reports";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = await hasApplicationRole(user.id, "MEETING_ROOMS");
  if (!admin && !(await hasPermission(user.id, "VIEW_MEETING_REPORTS", "MEETING_ROOMS"))) {
    redirect("/portal/meeting-rooms");
  }

  return <MeetingReports />;
}
