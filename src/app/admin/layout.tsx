import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-session";
import { Role } from "@prisma/client";
import { AdminLayoutShell } from "@/components/admin/admin-layout-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  return (
    <AdminLayoutShell sessionIdentifier={session.user.identifier}>
      {children}
    </AdminLayoutShell>
  );
}
