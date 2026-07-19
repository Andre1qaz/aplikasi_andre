"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, FileText, Clock, Users, ChevronLeft, Plus, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CourseCard } from "@/components/courses/course-card";
import { ModuleFormDialog } from "@/components/modules/module-form-dialog";
import { FileUploadDialog } from "@/components/modules/file-upload-dialog";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
  enrollmentCode: string;
  description: string | null;
  learningObjectives: string | null;
  thumbnailColor: string;
  category: { name: string } | null;
  instructor: { id: string; name: string; email: string };
  modules: Module[];
  assignments: Assignment[];
  exams: Exam[];
  _count: {
    enrollments: number;
    modules: number;
    assignments: number;
    exams: number;
  };
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
  uploadedAt: string;
}

interface Assignment {
  id: string;
  title: string;
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
// Heuristic #12: Clarity of Purpose and Objectives — display learning objectives prominently
// Heuristic #23: Relevancy — show updatedAt for content freshness

export default function CourseDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    if (session?.user && params.id) {
      fetchCourse();
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

  const handleCreateModule = () => {
    setSelectedModule(null);
    setShowModuleDialog(true);
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    setShowModuleDialog(true);
  };

  const handleModuleSuccess = () => {
    fetchCourse();
  };

  const handleUploadFile = (module: Module) => {
    setSelectedModule(module);
    setShowUploadDialog(true);
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

  const isInstructor = session?.user?.id === course.instructor.id;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with course info */}
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
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{course.code}</p>
            <h1 className="font-display text-3xl font-bold mt-1">{course.name}</h1>
            {course.category && (
              <span className="inline-block mt-2 text-xs bg-white/20 px-3 py-1 rounded-full">
                {course.category.name}
              </span>
            )}
          </div>
          {(isInstructor || isAdmin) && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Course
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-8 py-6 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Learning Objectives */}
            {/* Heuristic #12: Clarity of Purpose and Objectives */}
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

            {/* Description */}
            {course.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Deskripsi Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Modules */}
            {/* Heuristic #15: Learning Design — structured module order */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Modul Pembelajaran
                </CardTitle>
                {(isInstructor || isAdmin) && (
                  <Button size="sm" onClick={handleCreateModule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Modul
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {course.modules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Belum ada modul</p>
                    {(isInstructor || isAdmin) && (
                      <Button size="sm" variant="outline" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Modul Pertama
                      </Button>
                    )}
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
                              Diperbarui: {new Date(module.updatedAt).toLocaleDateString("id-ID")}
                            </span>
                          </div>
                        </div>
                        {(isInstructor || isAdmin) && (
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleUploadFile(module)}
                              title="Upload File"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => handleEditModule(module)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Tugas
                </CardTitle>
                {(isInstructor || isAdmin) && (
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Tugas
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {course.assignments.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Belum ada tugas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {course.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Deadline: {new Date(assignment.deadline).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-accent">
                          {assignment.maxScore} poin
                        </span>
                      </div>
                    ))}
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
                  <p className="text-xs text-muted-foreground">{course.instructor.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-accent">{course._count.modules}</p>
                    <p className="text-xs text-muted-foreground">Modul</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{course._count.assignments}</p>
                    <p className="text-xs text-muted-foreground">Tugas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{course._count.exams}</p>
                    <p className="text-xs text-muted-foreground">Ujian</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{course._count.enrollments}</p>
                    <p className="text-xs text-muted-foreground">Mahasiswa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Code */}
            {(isInstructor || isAdmin) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kode Enrollment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-center font-mono text-lg">
                      {course.enrollmentCode}
                    </code>
                    <Button size="icon" variant="outline">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bagikan kode ini kepada mahasiswa untuk bergabung ke course.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Module Form Dialog */}
      <ModuleFormDialog
        open={showModuleDialog}
        onOpenChange={setShowModuleDialog}
        courseId={course.id}
        module={selectedModule}
        onSuccess={handleModuleSuccess}
      />

      {/* File Upload Dialog */}
      {selectedModule && (
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          moduleId={selectedModule.id}
          onSuccess={handleModuleSuccess}
        />
      )}
    </div>
  );
}
