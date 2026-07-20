"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, FileText, Clock, ChevronLeft, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentSubmitDialog } from "@/components/assignments/assignment-submit-dialog";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  learningObjectives: string | null;
  thumbnailColor: string;
  category: { name: string } | null;
  instructor: { name: string };
  modules: Module[];
  assignments: Assignment[];
  exams: Exam[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  learningObjectives: string | null;
  order: number;
  updatedAt: string;
  files: ModuleFile[];
}

interface ModuleFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  maxScore: number;
}

interface Exam {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  deadline: string;
  isPublished: boolean;
}

// Heuristic #6: Recognition Rather Than Recall — breadcrumb navigation
// Heuristic #12: Clarity of Purpose and Objectives — display learning objectives
// Heuristic #21: Motivation to Learn — progress indicators

export default function StudentCourseDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});

  useEffect(() => {
    if (session?.user && params.id) {
      fetchCourse();
      fetchMySubmissions();
    }
  }, [session, params.id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setCourse(result.data);
      } else {
        toast.error(result.message || "Gagal memuat course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat course");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const assignmentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/course/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      const assignmentsResult = await assignmentsResponse.json();
      
      if (assignmentsResult.success) {
        const submissions: Record<string, any> = {};
        for (const assignment of assignmentsResult.data) {
          const subResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment.id}/my-submission`,
            {
              headers: {
                Authorization: `Bearer ${session?.accessToken}`,
              },
            }
          );
          const subResult = await subResponse.json();
          if (subResult.success && subResult.data) {
            submissions[assignment.id] = subResult.data;
          }
        }
        setMySubmissions(submissions);
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    }
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitDialog(true);
  };

  const handleSubmissionSuccess = () => {
    fetchMySubmissions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Course tidak ditemukan</p>
            <Button onClick={() => router.back()}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="h-48 px-8 py-6 text-white"
        style={{ backgroundColor: course.thumbnailColor }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-white hover:bg-white/20"
          onClick={() => router.back()}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Kembali
        </Button>
        <div>
          <p className="text-sm font-medium opacity-80">{course.code}</p>
          <h1 className="font-display text-3xl font-bold mt-1">{course.name}</h1>
          {course.category && (
            <span className="inline-block mt-2 text-xs bg-white/20 px-3 py-1 rounded-full">
              {course.category.name}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-8 py-6 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Objectives */}
            {course.learningObjectives && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent" />
                    Tujuan Pembelajaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {course.learningObjectives}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Modul Pembelajaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.modules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada modul</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {module.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{module.title}</h4>
                          {module.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {module.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {module.files.length} File
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(module.updatedAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Tugas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.assignments.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Belum ada tugas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {course.assignments.map((assignment) => {
                      const submission = mySubmissions[assignment.id];
                      const isLate = now > new Date(assignment.deadline);
                      const canSubmit = !submission && !isLate;

                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{assignment.title}</p>
                              {isLate && !submission && (
                                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                                  Terlambat
                                </span>
                              )}
                              {submission?.status === "GRADED" && (
                                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                                  Sudah Dinilai
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Deadline: {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {submission && (
                                <span className="flex items-center gap-1">
                                  Nilai: {submission.score || "-"} / {assignment.maxScore}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission ? (
                              <span className="text-xs text-success font-medium">
                                ✓ Dikumpulkan
                              </span>
                            ) : canSubmit ? (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitAssignment(assignment)}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                              </Button>
                            ) : (
                              <span className="text-xs text-destructive">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                {isLate ? "Deadline Lewat" : "Tidak Dapat Submit"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Ujian
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.exams.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Belum ada ujian
                  </p>
                ) : (
                  <div className="space-y-2">
                    {course.exams.map((exam) => {
                      const startTime = new Date(exam.startTime);
                      const deadline = new Date(exam.deadline);
                      const isPublished = exam.isPublished;
                      const isUpcoming = now < startTime;
                      const isAvailable = isPublished && now >= startTime && now <= deadline;
                      const isEnded = now > deadline;

                      return (
                        <div
                          key={exam.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{exam.title}</p>
                              {!isPublished && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                  Draft
                                </span>
                              )}
                              {isAvailable && (
                                <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                                  Tersedia
                                </span>
                              )}
                              {isEnded && (
                                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                                  Selesai
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {exam.duration} menit
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {startTime.toLocaleDateString("id-ID")}
                              </span>
                            </div>
                          </div>
                          <div>
                            {isAvailable && (
                              <Button size="sm">
                                Mulai Ujian
                              </Button>
                            )}
                            {isUpcoming && (
                              <span className="text-xs text-muted-foreground">
                                Mulai: {startTime.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dosen Pengampu</p>
                  <p className="font-medium text-sm">{course.instructor.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-accent">{course.modules.length}</p>
                    <p className="text-xs text-muted-foreground">Modul</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{course.assignments.length}</p>
                    <p className="text-xs text-muted-foreground">Tugas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{course.exams.length}</p>
                    <p className="text-xs text-muted-foreground">Ujian</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assignment Submit Dialog */}
      {selectedAssignment && (
        <AssignmentSubmitDialog
          open={showSubmitDialog}
          onOpenChange={setShowSubmitDialog}
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          onSuccess={handleSubmissionSuccess}
        />
      )}
    </div>
  );
}
