"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Filter, Plus, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { apiFetch } from "@/lib/api";

interface Course {
  id: string;
  name: string;
  code: string;
  thumbnailColor: string;
  category?: { name: string } | null;
  instructor?: { name: string } | null;
  progress?: number;
  _count?: {
    modules: number;
    assignments: number;
    exams: number;
    enrollments: number;
  };
}

interface DashboardContentProps {
  role: string;
  basePath: string;
  title: string;
  subtitle: string;
}

export function DashboardContent({
  role,
  basePath,
  title,
  subtitle,
}: DashboardContentProps) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function fetchCourses() {
      if (!session?.accessToken) return;

      try {
        const res = await apiFetch<Course[]>(
          "/courses/dashboard",
          {},
          session.accessToken,
        );
        setCourses(res.data ?? []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [session?.accessToken]);

  const categories = [
    ...new Set(courses.map((c) => c.category?.name).filter(Boolean)),
  ] as string[];

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || c.category?.name === categoryFilter;
    return matchSearch && matchCategory;
  });

  const grouped = categories.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((c) => c.category?.name === cat);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  const uncategorized = filtered.filter((c) => !c.category);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {(role === "DOSEN" || role === "ADMIN") && (
          <Button className="gap-2" onClick={() => window.location.href = `${basePath}/courses`}>
            <Plus className="size-4" />
            Buat Course
          </Button>
        )}
        {role === "MAHASISWA" && (
          <Button className="gap-2" onClick={() => window.location.href = `${basePath}/courses/join`}>
            <Plus className="size-4" />
            Gabung Course
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari course berdasarkan nama atau kode..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Tahun Ajaran</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <BookOpen className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">Belum ada course</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {role === "MAHASISWA"
              ? "Gabung course menggunakan kode enrollment dari dosen Anda."
              : "Buat course pertama Anda untuk memulai."}
          </p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([cat, catCourses]) =>
            catCourses.length > 0 ? (
              <section key={cat}>
                <h2 className="font-display mb-4 text-lg font-semibold text-muted-foreground">
                  {cat}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...course}
                      href={`${basePath}/courses/${course.id}`}
                      stats={{
                        modules: course._count?.modules,
                        enrollments: course._count?.enrollments,
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )}
          {uncategorized.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-lg font-semibold text-muted-foreground">
                Lainnya
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorized.map((course) => (
                  <CourseCard
                    key={course.id}
                    {...course}
                    href={`${basePath}/courses/${course.id}`}
                    stats={{
                      modules: course._count?.modules,
                      enrollments: course._count?.enrollments,
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
