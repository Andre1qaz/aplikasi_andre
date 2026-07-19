import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <DashboardContent
          role="ADMIN"
          basePath="/admin"
          title="Semua Course"
          subtitle="Kelola seluruh course di sistem"
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
