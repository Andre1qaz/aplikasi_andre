/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
  thumbnailColor: string;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  deadline: string;
  duration: number;
  isPublished: boolean;
  course: Course;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface ExamsClientProps {
  token: string;
}

export function ExamsClient({ token }: ExamsClientProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      // eslint-disable-next-line react-hooks/immutability
      fetchAllExams();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      } else {
        toast.error(result.message || "Gagal memuat courses");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat courses");
    }
  };

  const fetchAllExams = async () => {
    try {
      setLoading(true);
      const allExams: Exam[] = [];

      // Fetch exams for each course
      for (const course of courses) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/exams/course/${course.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (result.success && result.data) {
          // Backend tidak selalu menyertakan relasi `course` di tiap exam,
          // jadi kita tambal manual pakai data course dari loop ini
          const examsWithCourse = result.data.map((exam: Exam) => ({
            ...exam,
            course: exam.course ?? course,
          }));
          allExams.push(...examsWithCourse);
        }
      }

      setExams(allExams);
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat ujian");
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.course?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.course?.code ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse =
      selectedCourse === "all" || exam.course?.id === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (isPublished: boolean, startTime: string, deadline: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(deadline);

    if (!isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    } else if (now < start) {
      return <Badge variant="outline">Akan Datang</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge className="bg-success/10 text-success">Sedang Berlangsung</Badge>;
    } else {
      return <Badge variant="secondary">Selesai</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Semua Ujian</h1>
            <p className="text-muted-foreground">Kelola semua ujian di platform</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari ujian berdasarkan judul atau course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">Semua Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Belum ada ujian</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCourse !== "all"
                ? "Tidak ada ujian yang cocok dengan filter"
                : "Belum ada ujian yang dibuat di platform"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        {getStatusBadge(exam.isPublished, exam.startTime, exam.deadline)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: exam.course?.thumbnailColor ?? "#999999" }}
                        />
                        <span className="font-medium">{exam.course?.code ?? "-"}</span>
                        <span>-</span>
                        <span>{exam.course?.name ?? "Course tidak diketahui"}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-4">{exam.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Durasi</p>
                      <p className="font-medium">{exam.duration} menit</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mulai</p>
                      <p className="font-medium">{formatDate(exam.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium">{formatDate(exam.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Soal / Peserta</p>
                      <p className="font-medium">
                        {exam._count.questions} / {exam._count.attempts}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/admin/courses/${exam.course?.id ?? ""}`}>Lihat Course</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}