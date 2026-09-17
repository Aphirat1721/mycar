import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";
import { hasPermission } from "@/lib/authorization";
import MeetingReports from "@/components/meeting-reports";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = user.roles.some(({ role }) => ["SUPER_ADMIN", "ADMIN"].includes(role.key));
  if (!admin && !(await hasPermission(user.id, "VIEW_MEETING_REPORTS"))) {
    redirect("/portal/meeting-rooms");
  }

  return <MeetingReports />;
}
