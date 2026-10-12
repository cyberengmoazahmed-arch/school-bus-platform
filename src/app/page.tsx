import Link from "next/link";
import { Bus, MapPin, ShieldCheck, BellRing, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: <MapPin size={20} />,
    title: "Live GPS tracking",
    body: "Follow the bus in real time on an open map. Know exactly when it reaches your child's stop.",
  },
  {
    icon: <BellRing size={20} />,
    title: "Smart arrival alerts",
    body: "Parents get notified as the bus approaches, when the child boards, arrives at school, and gets dropped off.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Driver accountability",
    body: "Drivers reconcile every child on a manifest. A trip cannot close with anyone unaccounted for.",
  },
  {
    icon: <Wallet size={20} />,
    title: "Subscriptions & billing",
    body: "Distance-based pricing, sibling discounts, promo codes, invoices, and card payments.",
  },
];

const demoAccounts = [
  ["Parent — Ahmed Hassan", "parent1@saferide.demo"],
  ["Parent — Fatma (co-guardian)", "parent1b@saferide.demo"],
  ["Driver — Mohamed Sabry", "driver1@saferide.demo"],
  ["School Admin — NIS", "principal@nis.demo"],
  ["School Admin — PLS", "principal@pls.demo"],
  ["Super Admin", "admin@saferide.demo"],
  ["Support", "support@saferide.demo"],
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <Bus size={20} />
          </span>
          <span className="text-lg font-semibold tracking-tight">SafeRide</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Create account</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          School bus journeys, <span className="text-primary">tracked live</span> — from door to door.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          SafeRide connects parents, drivers, and schools on one platform: real-time GPS, arrival alerts,
          safety reconciliation, and distance-based subscriptions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              <Plus size={18} /> Create a parent account
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="space-y-2 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600">{f.icon}</span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <Card className="border-dashed">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Demo accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The database is seeded with realistic data. Sign in with any account — password is{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">Password123!</code>
            </p>
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
              {demoAccounts.map(([name, email]) => (
                <li key={email} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <span>{name}</span>
                  <code className="text-xs text-muted-foreground">{email}</code>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        SafeRide — safe school transportation, tracked live.
      </footer>
    </div>
  );
}