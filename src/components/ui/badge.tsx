import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral: "bg-slate-100 text-slate-700 ring-slate-200",
        primary: "bg-blue-50 text-blue-700 ring-blue-200",
        success: "bg-green-50 text-green-700 ring-green-200",
        warning: "bg-amber-50 text-amber-700 ring-amber-200",
        danger: "bg-red-50 text-red-700 ring-red-200",
        info: "bg-sky-50 text-sky-700 ring-sky-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

type Tone = NonNullable<BadgeProps["tone"]>;

const STATUS_TONES: Record<string, Tone> = {
  // Trip / student
  SCHEDULED: "info",
  EXPECTED: "info",
  IN_PROGRESS: "primary",
  ONBOARD: "primary",
  COMPLETED: "success",
  DROPPED: "success",
  ACTIVE: "success",
  SUCCEEDED: "success",
  VERIFIED: "success",
  DELIVERED: "success",
  // Warnings
  PAUSED: "warning",
  PENDING: "warning",
  MISSED: "warning",
  WAITING: "warning",
  OVERDUE: "warning",
  SUSPENDED: "danger",
  UNACCOUNTED: "danger",
  FAILED: "danger",
  ABSENT: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REFUNDED: "neutral",
  CLOSED: "neutral",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? "neutral";
  return (
    <Badge tone={tone} className={className}>
      {status.replaceAll("_", " ").toLowerCase()}
    </Badge>
  );
}
