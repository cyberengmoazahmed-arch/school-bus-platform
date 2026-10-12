"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, Crosshair, ChevronDown, ChevronUp } from "lucide-react";
import {
  assignTicketAction,
  replyTicketAction,
  resolveTicketAction,
} from "@/app/actions/support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/datetime";
import type { Locale } from "@/lib/i18n/client";

type TicketLite = {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: string;
  resolution: string | null;
  requesterName: string;
  requesterRole: string;
  assigneeName: string | null;
  messages: { id: string; body: string; authorName: string; createdAt: string }[];
};

export function SupportQueue({ locale, role, tickets }: { locale: Locale; role: string; tickets: TicketLite[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pending, startTransition] = useTransition();
  const isStaff = role === "SUPPORT" || role === "SUPER_ADMIN";

  const refresh = () => router.refresh();

  const act = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      refresh();
    });

  const sendReply = (ticket: TicketLite) => {
    if (!replyText.trim()) return;
    act(() => replyTicketAction(ticket.id, replyText));
    setReplyText("");
  };

  if (tickets.length === 0) return <EmptyState title="Queue is clear" description="No tickets match your role yet." />;

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const isOpen = expanded === ticket.id;
        return (
          <Card key={ticket.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  className="text-start"
                  onClick={() => setExpanded(isOpen ? null : ticket.id)}
                >
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 6)} · {ticket.category.replaceAll("_", " ")} · {ticket.requesterName} (
                    {ticket.requesterRole.toLowerCase()}) · {formatDateTime(ticket.createdAt, locale)}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <Badge tone={ticket.status === "RESOLVED" ? "success" : ticket.status === "IN_PROGRESS" ? "warning" : "info"}>
                    {ticket.status.toLowerCase()}
                  </Badge>
                  <Badge tone={ticket.priority === "URGENT" ? "danger" : ticket.priority === "HIGH" ? "warning" : "neutral"}>
                    {ticket.priority.toLowerCase()}
                  </Badge>
                  {ticket.assigneeName ? <Badge tone="primary">→ {ticket.assigneeName}</Badge> : null}
                  <span className="cursor-pointer text-muted-foreground">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                </div>
              </div>

              {isOpen ? (
                <div className="mt-3 space-y-3 border-t border-border pt-3 text-sm">
                  <p>{ticket.body}</p>
                  {ticket.messages.map((m) => (
                    <div key={m.id} className="rounded-lg bg-muted/60 px-3 py-2">
                      <span className="font-medium">{m.authorName}</span>{" "}
                      <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt, locale)}</span>
                      <p className="mt-0.5">{m.body}</p>
                    </div>
                  ))}

                  {ticket.status !== "RESOLVED" ? (
                    <div className="flex flex-wrap gap-2">
                      {isStaff && !ticket.assigneeName ? (
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => assignTicketAction(ticket.id))}>
                          <Crosshair size={14} /> Assign to me
                        </Button>
                      ) : null}
                      <div className="flex flex-1 gap-2">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply…"
                          disabled={pending}
                        />
                        <Button size="sm" variant="outline" disabled={pending || !replyText.trim()} onClick={() => sendReply(ticket)}>
                          <Send size={14} /> Send
                        </Button>
                      </div>
                      {isStaff ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            const resolution = replyText.trim() || "Resolved by support.";
                            act(() => resolveTicketAction(ticket.id, resolution));
                          }}
                        >
                          <CheckCircle2 size={14} /> Resolve
                        </Button>
                      ) : null}
                    </div>
                  ) : ticket.resolution ? (
                    <p className="rounded-lg bg-green-50 px-3 py-2 text-green-700 ring-1 ring-green-200">
                      Resolved: {ticket.resolution}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}