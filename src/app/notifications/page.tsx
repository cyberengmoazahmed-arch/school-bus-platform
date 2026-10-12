import { requireUser } from "@/data/auth";
import { getNotifications, getNotificationPreferences } from "@/data/notifications";
import { getT } from "@/lib/i18n";
import { AnyRoleShell } from "@/components/layout/role-shell";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const [items, pref] = await Promise.all([getNotifications(user.id), getNotificationPreferences(user.id)]);

  return (
    <AnyRoleShell>
      <NotificationsView
        t={t}
        locale={locale}
        items={items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          severity: n.severity,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        }))}
        pref={{
          emailEnabled: pref.emailEnabled,
          smsEnabled: pref.smsEnabled,
          pushEnabled: pref.pushEnabled,
          whatsappEnabled: pref.whatsappEnabled,
          before10: pref.before10,
          before5: pref.before5,
          arrivalAlert: pref.arrivalAlert,
          boardedAlert: pref.boardedAlert,
          schoolArrival: pref.schoolArrival,
          droppedHome: pref.droppedHome,
          delayAlerts: pref.delayAlerts,
        }}
      />
    </AnyRoleShell>
  );
}