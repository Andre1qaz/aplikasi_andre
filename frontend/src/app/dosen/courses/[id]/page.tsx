import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CourseDetailClient } from "@/components/course-detail/course-detail-client";

export default async function DosenCourseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") redirect("/403");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Courses", href: "/dosen/courses" },
          { label: "Course Detail" },
        ]}
      >
        <CourseDetailClient
          courseId={params.id}
          token={session.accessToken}
          userRole={session.user.role}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
