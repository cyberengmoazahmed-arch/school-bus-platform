"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBell({ href }: { href: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUnread(data.count ?? 0);
        }
      } catch {
        /* ignore transient network errors */
      }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href={href}
      className="relative inline-flex h-10 items-center rounded-lg px-2.5 text-slate-600 hover:bg-muted hover:text-foreground"
      title="Notifications"
    >
      <Bell size={18} />
      {unread > 0 ? (
        <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}