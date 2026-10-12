import type { ReactNode } from "react";
import { Home, Users, MapPin, CreditCard, Calculator, Bell, Headphones, Bus, School, Truck, AlertTriangle, Ticket, ScrollText, FileBarChart, Navigation } from "lucide-react";
import { requireRole, requireUser } from "@/data/auth";
import { ROLE_LABEL, type Role } from "@/lib/enums";
import { getT } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/client";
import { AppShell } from "./app-shell";
import { signOutAction } from "@/app/actions/session";

function roleNav(role: Role, t: Dictionary) {
  const icon: Record<string, ReactNode> = {
    home: <Home size={18} />,
    users: <Users size={18} />,
    map: <MapPin size={18} />,
    card: <CreditCard size={18} />,
    calc: <Calculator size={18} />,
    bell: <Bell size={18} />,
    headphones: <Headphones size={18} />,
    bus: <Bus size={18} />,
    school: <School size={18} />,
    truck: <Truck size={18} />,
    alert: <AlertTriangle size={18} />,
    ticket: <Ticket size={18} />,
    log: <ScrollText size={18} />,
    report: <FileBarChart size={18} />,
    route: <Navigation size={18} />,
  };

  const nav =
    role === "PARENT"
      ? t.nav.parent
      : role === "DRIVER"
        ? t.nav.driver
        : role === "SCHOOL_ADMIN"
          ? t.nav.school
          : role === "SUPER_ADMIN"
            ? t.nav.admin
            : t.nav.support;

  const items: { href: string; label: string; icon: ReactNode }[] = [];
  const push = (href: string, labelKey: string, iconKey = "home") =>
    items.push({ href, label: nav[labelKey as keyof typeof nav] ?? labelKey, icon: icon[iconKey] });
  const home = "/" + role.toLowerCase();

  if (role === "PARENT") {
    push("/parent", "dashboard", "home");
    push("/parent/children", "children", "users");
    push("/parent/tracking", "tracking", "map");
    push("/parent/subscription", "subscription", "card");
    push("/parent/pricing", "pricing", "calc");
    push("/notifications", "notifications", "bell");
    push("/parent/support", "support", "headphones");
  } else if (role === "DRIVER") {
    push("/driver", "dashboard", "home");
    push("/notifications", "notifications", "bell");
  } else if (role === "SCHOOL_ADMIN") {
    push("/school", "dashboard", "home");
    push("/school/students", "students", "users");
    push("/school/routes", "routes", "route");
    push("/school/reports", "reports", "report");
    push("/school/incidents", "incidents", "alert");
    push("/notifications", "notifications", "bell");
  } else if (role === "SUPER_ADMIN") {
    push("/admin", "dashboard", "home");
    push("/admin/fleet", "fleet", "bus");
    push("/admin/drivers", "drivers", "truck");
    push("/admin/schools", "schools", "school");
    push("/admin/routes", "routes", "route");
    push("/admin/subscriptions", "subscriptions", "card");
    push("/admin/safety", "incidents", "alert");
    push("/admin/support", "tickets", "ticket");
    push("/admin/audit", "audit", "log");
    push("/notifications", "notifications", "bell");
  } else if (role === "SUPPORT") {
    push("/support", "dashboard", "ticket");
    push("/notifications", "notifications", "bell");
  }

  return { items, home };
}

export async function RoleShell({ role, children }: { role: Role; children: ReactNode }) {
  const user = await requireRole(role);
  const { locale, t } = await getT();
  const { items, home } = roleNav(role, t);

  return (
    <AppShell
      user={{ name: user.fullName, email: user.email }}
      roleLabel={ROLE_LABEL[role]}
      items={items}
      locale={locale}
      notificationsHref="/notifications"
      signOutAction={signOutAction}
    >
      {children}
    </AppShell>
  );
}

/** AppShell for pages shared by every role. */
export async function AnyRoleShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <RoleShell role={user.role as Role}>{children}</RoleShell>;
}