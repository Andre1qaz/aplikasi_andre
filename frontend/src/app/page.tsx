import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getDashboardPath(session.user.role));
  }

  redirect("/login");
}
