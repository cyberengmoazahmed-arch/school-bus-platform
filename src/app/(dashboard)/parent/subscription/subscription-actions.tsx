"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelSubscriptionAction,
  pauseSubscriptionAction,
  resumeSubscriptionAction,
} from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";

export function SubscriptionActions({ subscriptionId, status }: { subscriptionId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  if (status === "PAUSED") {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resumeSubscriptionAction(subscriptionId))}>
        Resume
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => pauseSubscriptionAction(subscriptionId))}>
        Pause
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => cancelSubscriptionAction(subscriptionId))}>
        Cancel
      </Button>
    </>
  );
}