import { requireUser } from "@/data/auth";
import { getTicketsForSupport } from "@/data/support";
import { getT } from "@/lib/i18n";
import { StatCard, SectionHeader } from "@/components/ui/misc";
import { Ticket, Hourglass, CircleCheckBig, Flame } from "lucide-react";
import { SupportQueue } from "./support-queue";

export default async function SupportDashboardPage() {
  const user = await requireUser();
  const { locale } = await getT();
  const tickets = await getTicketsForSupport(user.id, user.role);

  const open = tickets.filter((x) => ["OPEN", "WAITING"].includes(x.status));
  const inProgress = tickets.filter((x) => x.status === "IN_PROGRESS");
  const resolved = tickets.filter((x) => x.status === "RESOLVED");
  const urgent = tickets.filter((x) => x.priority === "URGENT" && x.status !== "RESOLVED");

  return (
    <div className="space-y-5">
      <SectionHeader title="Support queue" description={`${tickets.length} tickets shown`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open" value={open.length} icon={<Ticket size={18} />} tone="primary" />
        <StatCard label="In progress" value={inProgress.length} icon={<Hourglass size={18} />} tone="warning" />
        <StatCard label="Resolved" value={resolved.length} icon={<CircleCheckBig size={18} />} tone="success" />
        <StatCard label="Urgent" value={urgent.length} icon={<Flame size={18} />} tone="danger" />
      </div>

      <SupportQueue
        locale={locale}
        role={user.role}
        tickets={tickets.map((x) => ({
          id: x.id,
          category: x.category,
          subject: x.subject,
          body: x.body,
          status: x.status,
          priority: x.priority,
          createdAt: x.createdAt.toISOString(),
          resolution: x.resolution,
          requesterName: x.requester?.fullName ?? "Unknown",
          requesterRole: x.requester?.role ?? "PARENT",
          assigneeName: x.assignee?.fullName ?? null,
          messages: x.messages.map((m) => ({
            id: m.id,
            body: m.body,
            authorName: m.author.fullName,
            createdAt: m.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}