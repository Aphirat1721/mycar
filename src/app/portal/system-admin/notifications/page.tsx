import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authorization";
import NotificationSettingsForm from "@/components/notification-settings-form";

const KEYS = ["MOPH_NOTIFY_BASE_URL", "MOPH_NOTIFY_CLIENT_KEY", "MOPH_NOTIFY_SECRET_KEY", "MOPH_NOTIFY_GROUP_BASE_URL", "MOPH_NOTIFY_GROUP_ENABLED", "MOPH_NOTIFY_GROUP_CLIENT_KEY", "MOPH_NOTIFY_GROUP_SECRET_KEY"] as const;

export default async function NotificationSettingsPage() {
  await requireAdmin();
  const settings = await prisma.notificationSetting.findMany({ where: { key: { in: [...KEYS] } } });
  const values = Object.fromEntries(settings.map((item) => [item.key, item.isSecret ? "" : item.value ?? ""]));
  const configured = new Set(settings.filter((item) => item.value).map((item) => item.key));

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-sm font-bold tracking-[0.14em] text-amber-700">SYSTEM SETTINGS / NOTIFICATIONS</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">ตั้งค่า MOPH Notify</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">ตั้งค่าการส่งแจ้งเตือน 2 ช่องทาง: รายบุคคลผ่าน Alert Free Form JSON 3.1 และ LINE group chats ผ่าน MOPH Notify โดยไม่แสดงค่า credentials ที่บันทึกไว้</p>
      </div>
      <NotificationSettingsForm initialValues={values} configuredKeys={[...configured]} />
    </section>
  );
}
