"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { SignOutButton } from "./sign-out-button";
import { NotificationBell } from "./notification-bell";

export type NavItem = { href: string; label: string; icon: ReactNode };

export function AppShell({
  user,
  roleLabel,
  items,
  children,
  locale,
  notificationsHref,
  signOutAction,
}: {
  user: { name: string; email: string };
  roleLabel: string;
  items: NavItem[];
  children: ReactNode;
  locale: "en" | "ar";
  notificationsHref: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.href) ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="grid h-5 w-5 place-items-center">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <Link href={items[0]?.href ?? "/"} className="flex items-center gap-2 px-4 py-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
        <Bus size={20} />
      </span>
      <span className="text-lg font-semibold tracking-tight">SafeRide</span>
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-e border-border bg-card lg:flex lg:flex-col">
        {brand}
        <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{roleLabel}</div>
        {nav}
        <div className="mt-auto border-t border-border p-3">
          <UserBlock user={user} roleLabel={roleLabel} signOutAction={signOutAction} />
        </div>
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between">
              {brand}
              <button className="me-3 rounded-lg p-2 hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {nav}
            <div className="mt-auto border-t border-border p-3">
              <UserBlock user={user} roleLabel={roleLabel} signOutAction={signOutAction} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="lg:hidden">
            <span className="font-semibold">SafeRide</span>
          </div>
          <div className="ms-auto flex items-center gap-1.5">
            <NotificationBell href={notificationsHref} />
            <LocaleSwitcher current={locale} />
            <div className="hidden lg:block">
              <SignOutButton action={signOutAction} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function UserBlock({
  user,
  roleLabel,
  signOutAction,
}: {
  user: { name: string; email: string };
  roleLabel: string;
  signOutAction: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
        {user.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
      </div>
      <div className="lg:hidden">
        <SignOutButton action={signOutAction} />
      </div>
    </div>
  );
}
