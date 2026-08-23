import { AdminGuard } from "@/components/admin/AdminGuard";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
