"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ current }: { current: "en" | "ar" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    const next = current === "en" ? "ar" : "en";
    startTransition(async () => {
      const { setLocaleAction } = await import("@/app/actions/locale");
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50",
      )}
      title={current === "en" ? "العربية" : "English"}
    >
      <Languages size={16} />
      <span>{current === "en" ? "EN" : "ع"}</span>
    </button>
  );
}