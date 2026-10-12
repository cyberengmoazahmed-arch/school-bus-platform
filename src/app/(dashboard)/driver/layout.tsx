import { RoleShell } from "@/components/layout/role-shell";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="DRIVER">{children}</RoleShell>;
}