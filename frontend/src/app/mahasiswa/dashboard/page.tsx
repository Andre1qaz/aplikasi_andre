import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function MahasiswaDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <DashboardContent
          role="MAHASISWA"
          basePath="/mahasiswa"
          title="Course Saya"
          subtitle="Daftar course yang sedang Anda ikuti"
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
