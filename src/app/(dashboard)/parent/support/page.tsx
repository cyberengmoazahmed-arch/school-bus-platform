import { Suspense } from "react";
import { requireUser } from "@/data/auth";
import { getParentTickets } from "@/data/parent";
import { getT } from "@/lib/i18n";
import { ParentSupport } from "./parent-support";

export default async function ParentSupportPage() {
  const user = await requireUser();
  const { locale } = await getT();
  const tickets = await getParentTickets(user.id);

  return (
    <Suspense>
      <ParentSupport
        locale={locale}
        initialTickets={tickets.map((t) => ({
          id: t.id,
          category: t.category,
          subject: t.subject,
          body: t.body,
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt.toISOString(),
          resolution: t.resolution,
          messages: t.messages.map((m) => ({
            id: m.id,
            body: m.body,
            authorName: m.author.fullName,
            createdAt: m.createdAt.toISOString(),
          })),
        }))}
      />
    </Suspense>
  );
}