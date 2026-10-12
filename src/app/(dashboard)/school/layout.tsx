import { RoleShell } from "@/components/layout/role-shell";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="SCHOOL_ADMIN">{children}</RoleShell>;
}