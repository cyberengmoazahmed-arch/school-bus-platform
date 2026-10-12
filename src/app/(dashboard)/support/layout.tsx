import { RoleShell } from "@/components/layout/role-shell";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="SUPPORT">{children}</RoleShell>;
}