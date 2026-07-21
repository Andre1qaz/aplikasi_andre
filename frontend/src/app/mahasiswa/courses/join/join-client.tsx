"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface JoinCourseClientProps {
  token: string;
}

export function JoinCourseClient({ token }: JoinCourseClientProps) {
  const router = useRouter();
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinedCourse, setJoinedCourse] = useState<any>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentCode.trim()) {
      toast.error("Kode enrollment wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enrollmentCode: enrollmentCode.trim().toUpperCase() }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setJoinedCourse(result.data);
        toast.success("Berhasil bergabung ke course!");
        setEnrollmentCode("");
      } else {
        toast.error(result.message || "Kode enrollment tidak valid");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat bergabung ke course");
    } finally {
      setLoading(false);
    }
  };

  const goToCourse = () => {
    if (joinedCourse?.courseId) {
      router.push(`/mahasiswa/courses/${joinedCourse.courseId}`);
    }
  };

  const joinAnother = () => {
    setJoinedCourse(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!joinedCourse ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Gabung Course</CardTitle>
              <CardDescription>
                Masukkan kode enrollment yang diberikan dosen untuk bergabung ke course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentCode">Kode Enrollment</Label>
                  <Input
                    id="enrollmentCode"
                    value={enrollmentCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnrollmentCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: WEB2025"
                    disabled={loading}
                    maxLength={10}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Kode enrollment bersifat case-insensitive
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Gabung Course"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Belum punya kode enrollment?
                </p>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/mahasiswa/dashboard")}
                >
                  Kembali ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="font-display text-2xl">Berhasil Bergabung!</CardTitle>
              <CardDescription>
                Anda telah berhasil bergabung ke course
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-lg">{joinedCourse.courseName}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={joinAnother}
                >
                  Gabung Course Lain
                </Button>
                <Button
                  className="flex-1"
                  onClick={goToCourse}
                >
                  Buka Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
