import Link from "next/link";
import { prisma } from "@/lib/db";
import { paymentsMode } from "@/lib/payments/provider";
import { Bus } from "lucide-react";
import { DemoCheckout } from "./demo-checkout";

export default async function DemoPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mode = paymentsMode();
  const liveMode = mode === "live";

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { parent: { select: { fullName: true } } },
  });

  if (!payment) {
    return <div className="pt-20 text-center text-sm text-muted-foreground">Payment not found.</div>;
  }
  if (payment.status === "SUCCEEDED") {
    return (
      <div className="pt-20 text-center">
        <p className="font-medium">This payment is already completed.</p>
        <Link href="/parent/subscription" className="text-sm text-primary underline">
          Back to subscriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 py-10">
      <span className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-md">
        <Bus size={24} />
      </span>
      <DemoCheckout paymentId={payment.id} amount={payment.amountEGP} liveMode={liveMode} />
    </div>
  );
}