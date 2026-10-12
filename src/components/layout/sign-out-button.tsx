"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton({ action, className }: { action: () => Promise<void>; className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={cn("inline-flex", className)}
      action={() => startTransition(async () => action())}
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-muted hover:text-foreground disabled:opacity-50"
        title="Sign out"
      >
        <LogOut size={16} />
      </button>
    </form>
  );
}