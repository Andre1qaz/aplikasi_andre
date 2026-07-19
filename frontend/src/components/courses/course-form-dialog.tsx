"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: any;
  onSuccess?: () => void;
}

// Heuristic #5: Error Prevention — form validation before submission
// Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors — clear error messages
// Heuristic #3: User Control and Freedom — cancel button available

export function CourseFormDialog({ open, onOpenChange, course, onSuccess }: CourseFormDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: course?.name || "",
    code: course?.code || "",
    description: course?.description || "",
    learningObjectives: course?.learningObjectives || "",
    thumbnailColor: course?.thumbnailColor || "#1a365d",
    categoryId: course?.categoryId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Nama course wajib diisi");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Kode course wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const url = course
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses`;

      const response = await fetch(url, {
        method: course ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(course ? "Course berhasil diperbarui" : "Course berhasil dibuat");
        onOpenChange(false);
        onSuccess?.();
        
        // Reset form if creating new
        if (!course) {
          setFormData({
            name: "",
            code: "",
            description: "",
            learningObjectives: "",
            thumbnailColor: "#1a365d",
            categoryId: "",
          });
        }
      } else {
        toast.error(result.message || "Gagal menyimpan course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan course");
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: "#1a365d", label: "Deep Navy", color: "#1a365d" },
    { value: "#2d6a4f", label: "Forest Green", color: "#2d6a4f" },
    { value: "#e07a5f", label: "Coral", color: "#e07a5f" },
    { value: "#3d5a80", label: "Steel Blue", color: "#3d5a80" },
    { value: "#e63946", label: "Red", color: "#e63946" },
    { value: "#457b9d", label: "Sky Blue", color: "#457b9d" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Buat Course Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Course *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Pemrograman Web"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Kode Course *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Contoh: IF101"
                disabled={loading}
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang course..."
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningObjectives">Tujuan Pembelajaran</Label>
            <Textarea
              id="learningObjectives"
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              placeholder="1. Memahami konsep dasar&#10;2. Mampu menerapkan..."
              disabled={loading}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {/* Heuristic #12: Clarity of Purpose and Objectives */}
              Tuliskan tujuan pembelajaran secara terstruktur (gunakan angka untuk poin)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Warna Thumbnail</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, thumbnailColor: option.value })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.thumbnailColor === option.value
                      ? "border-accent scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: option.color }}
                  title={option.label}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {/* Heuristic #3: User Control and Freedom */}
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : course ? "Simpan Perubahan" : "Buat Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
