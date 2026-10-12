"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Send } from "lucide-react";
import { createTicketAction, replyTicketAction, type TicketState } from "@/app/actions/support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/datetime";
import type { Locale } from "@/lib/i18n/client";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: string;
  resolution: string | null;
  messages: { id: string; body: string; authorName: string; createdAt: string }[];
};

export function ParentSupport({ locale, initialTickets }: { locale: Locale; initialTickets: Ticket[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const tickets = initialTickets;
  const [replyText, setReplyText] = useState("");
  const [state, action, pending] = useActionState<TicketState, FormData>(createTicketAction, {});
  const [sending, startTransition] = useTransition();

  const sendReply = (ticketId: string) =>
    startTransition(async () => {
      await replyTicketAction(ticketId, replyText);
      setReplyText("");
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} ticket(s) — we usually reply within a few hours.
          </p>
        </div>
        <Button onClick={() => setCreateOpen((v) => !v)}>
          <MessageSquarePlus size={16} /> New ticket
        </Button>
      </div>

      {createOpen ? (
        <Card>
          <CardContent className="p-5">
            <form action={action} className="grid gap-3">
              <Field label="Category">
                <Select name="category" defaultValue="OTHER">
                  {[
                    "LATE_BUS",
                    "LOST_ITEM",
                    "DRIVER_FEEDBACK",
                    "SAFETY",
                    "BILLING",
                    "OTHER",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c.replaceAll("_", " ").toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <Input name="subject" placeholder="Brief summary" disabled={pending} />
              </Field>
              <Field label="Details">
                <Textarea name="body" placeholder="What happened?" disabled={pending} />
              </Field>
              {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Opening…" : "Open ticket"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tickets.length === 0 ? (
        <EmptyState title="No tickets yet" description="Create a ticket and our team will jump in." />
      ) : (
        tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 6)} · {ticket.category.replaceAll("_", " ")} · {formatDateTime(ticket.createdAt, locale)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone={ticket.status === "RESOLVED" ? "success" : ticket.status === "OPEN" ? "info" : "warning"}>
                    {ticket.status.toLowerCase()}
                  </Badge>
                  <Badge tone={ticket.priority === "URGENT" ? "danger" : "neutral"}>{ticket.priority.toLowerCase()}</Badge>
                </div>
              </div>

              <p className="mt-3 text-sm">{ticket.body}</p>

              {ticket.messages.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {ticket.messages.map((m) => (
                    <div key={m.id} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <span className="font-medium">{m.authorName}</span>{" "}
                      <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt, locale)}</span>
                      <p className="mt-0.5">{m.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {ticket.resolution ? (
                <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200">
                  Resolved: {ticket.resolution}
                </p>
              ) : null}

              {ticket.status !== "RESOLVED" ? (
                <div className="mt-3 flex gap-2">
                  <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply…" />
                  <Button variant="outline" disabled={sending || !replyText.trim()} onClick={() => sendReply(ticket.id)}>
                    <Send size={14} /> Send
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}