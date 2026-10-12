"use client";

import { useTransition } from "react";
import { Check, CheckCheck } from "lucide-react";
import { markAllReadAction, markReadAction, updatePrefsAction } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { relativeTime } from "@/lib/datetime";
import type { Dictionary, Locale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: string;
  readAt: string | null;
  createdAt: string;
};

const severityTone: Record<string, "info" | "success" | "warning" | "danger"> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  CRITICAL: "danger",
};

export function NotificationsView({
  t,
  locale,
  items,
  pref,
}: {
  t: Dictionary;
  locale: Locale;
  items: NotificationItem[];
  pref: Record<string, boolean> | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t.nav.parent.notifications}</h1>
          {items.some((n) => !n.readAt) ? (
            <Button variant="outline" size="sm" onClick={() => startTransition(() => markAllReadAction())} disabled={pending}>
              <CheckCheck size={15} /> {t.notifications.markAllRead}
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState title={t.common.noData} />
        ) : (
          items.map((n) => (
            <Card
              key={n.id}
              className={cn("animate-fade-in", !n.readAt && "border-primary/40 bg-blue-50/40")}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {n.severity ? (
                        <Badge tone={severityTone[n.severity] ?? "info"}>{n.severity.toLowerCase()}</Badge>
                      ) : null}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <time className="text-xs text-muted-foreground">{relativeTime(n.createdAt, locale)}</time>
                    {!n.readAt ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Mark as read"
                        onClick={() => startTransition(() => markReadAction(n.id))}
                      >
                        <Check size={15} />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <form
        action={(form: FormData) => {
          startTransition(async () => {
            await updatePrefsAction(form);
          });
        }}
        className="h-fit space-y-4 rounded-card border border-border bg-card p-5"
      >
        <h2 className="text-base font-semibold">{t.notifications.preferences}</h2>
        <div className="space-y-2 text-sm">
          {[
            ["emailEnabled", t.notifications.enableEmail],
            ["smsEnabled", t.notifications.enableSms],
            ["pushEnabled", t.notifications.enablePush],
            ["whatsappEnabled", t.notifications.enableWhatsapp],
          ].map(([key, label]) => (
            <Toggle key={key} name={key} label={label} checked={pref?.[key] ?? false} />
          ))}
        </div>
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          {[
            ["before10", t.notifications.before10],
            ["before5", t.notifications.before5],
            ["arrivalAlert", t.notifications.arrivalAlert],
            ["boardedAlert", t.notifications.boardedAlert],
            ["schoolArrival", t.notifications.schoolArrival],
            ["droppedHome", t.notifications.droppedHome],
            ["delayAlerts", t.notifications.delayAlerts],
          ].map(([key, label]) => (
            <Toggle key={key} name={key} label={label} checked={pref?.[key] ?? false} />
          ))}
        </div>
        <Button type="submit" size="sm">
          {t.common.save}
        </Button>
      </form>
    </div>
  );
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 rounded border-border text-primary" />
    </label>
  );
}