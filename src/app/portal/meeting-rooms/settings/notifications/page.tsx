import { redirect } from "next/navigation";

export default function LegacyNotificationSettingsPage() {
  redirect("/portal/system-admin/notifications");
}
