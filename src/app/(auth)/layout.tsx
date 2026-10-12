import Link from "next/link";
import { Bus } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-md">
          <Bus size={24} />
        </span>
        <span className="text-2xl font-bold tracking-tight text-foreground">SafeRide</span>
      </Link>
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        {children}
      </div>
    </div>
  );
}