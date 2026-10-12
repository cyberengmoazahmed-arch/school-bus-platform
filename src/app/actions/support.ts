"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserOrThrow } from "@/data/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";

export type TicketState = { ok?: boolean; error?: string };

const createSchema = z.object({
  category: z.string().min(1),
  subject: z.string().trim().min(4),
  body: z.string().trim().min(10),
});

export async function createTicketAction(_prev: TicketState, formData: FormData): Promise<TicketState> {
  const user = await requireUserOrThrow();
  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "FIELDS_REQUIRED" };
  const data = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      requesterId: user.id,
      category: data.category,
      subject: data.subject,
      body: data.body,
      status: "OPEN",
      priority: "NORMAL",
    },
  });

  await recordAudit({ actorId: user.id, action: "TICKET_CREATE", entity: "SupportTicket", entityId: ticket.id });

  // Notify the support / super-admin team.
  const staff = await prisma.user.findMany({ where: { role: { in: ["SUPPORT", "SUPER_ADMIN"] } } });
  for (const s of staff) {
    await dispatchNotification({
      userId: s.id,
      type: "TICKET_OPENED",
      title: `New ticket: ${data.subject}`,
      body: data.body,
      severity: "INFO",
    });
  }

  revalidatePath("/parent/support");
  revalidatePath("/support");
  return { ok: true };
}

export async function replyTicketAction(ticketId: string, body: string): Promise<TicketState> {
  const user = await requireUserOrThrow();
  const bodyText = body.trim();
  if (bodyText.length < 2) return { error: "EMPTY" };

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, OR: [{ requesterId: user.id }, { assigneeId: user.id }] },
  });
  if (!ticket) return { error: "FORBIDDEN" };

  await prisma.ticketMessage.create({ data: { ticketId, authorId: user.id, body: bodyText } });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: ticket.requesterId === user.id ? "WAITING" : "IN_PROGRESS", updatedAt: new Date() },
  });

  // Notify the other side.
  if (ticket.requesterId === user.id) {
    const staff = await prisma.user.findMany({ where: { role: { in: ["SUPPORT", "SUPER_ADMIN"] } } });
    for (const s of staff) {
      await dispatchNotification({
        userId: s.id,
        type: "TICKET_REPLY",
        title: `Reply on ticket #${ticketId.slice(0, 6)}`,
        body: bodyText,
        severity: "INFO",
      });
    }
  } else {
    await dispatchNotification({
      userId: ticket.requesterId,
      type: "TICKET_REPLY",
      title: `Support replied — ${ticket.subject}`,
      body: bodyText,
      severity: "INFO",
    });
  }

  revalidatePath("/parent/support");
  revalidatePath("/support");
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function assignTicketAction(ticketId: string): Promise<TicketState> {
  const user = await requireUserOrThrow();
  if (!["SUPPORT", "SUPER_ADMIN"].includes(user.role)) return { error: "FORBIDDEN" };
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { assigneeId: user.id, status: "IN_PROGRESS", updatedAt: new Date() },
  });
  revalidatePath("/support");
  return { ok: true };
}

export async function resolveTicketAction(ticketId: string, resolution: string): Promise<TicketState> {
  const user = await requireUserOrThrow();
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, OR: [{ assigneeId: user.id }, { requesterId: user.id }] },
  });
  if (!ticket) return { error: "FORBIDDEN" };

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", resolution: resolution.trim() || null, updatedAt: new Date() },
  });
  await dispatchNotification({
    userId: ticket.requesterId,
    type: "TICKET_RESOLVED",
    title: `Ticket resolved — ${ticket.subject}`,
    body: resolution.trim() || "Your ticket has been resolved.",
    severity: "SUCCESS",
  });
  revalidatePath("/parent/support");
  revalidatePath("/support");
  return { ok: true };
}