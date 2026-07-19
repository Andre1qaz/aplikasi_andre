"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  module?: any;
  onSuccess?: () => void;
}

// Heuristic #5: Error Prevention — form validation before submission
// Heuristic #12: Clarity of Purpose and Objectives — require learning objectives
// Heuristic #3: User Control and Freedom — cancel button available

export function ModuleFormDialog({ open, onOpenChange, courseId, module, onSuccess }: ModuleFormDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: module?.title || "",
    description: module?.description || "",
    learningObjectives: module?.learningObjectives || "",
    order: module?.order || 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Judul modul wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const url = module
        ? `${process.env.NEXT_PUBLIC_API_URL}/modules/${module.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/modules/course/${courseId}`;

      const response = await fetch(url, {
        method: module ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(module ? "Modul berhasil diperbarui" : "Modul berhasil dibuat");
        onOpenChange(false);
        onSuccess?.();
        
        if (!module) {
          setFormData({
            title: "",
            description: "",
            learningObjectives: "",
            order: 1,
          });
        }
      } else {
        toast.error(result.message || "Gagal menyimpan modul");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan modul");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{module ? "Edit Modul" : "Buat Modul Baru"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Modul *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Pengenalan Web Development"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang modul..."
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
              Tuliskan tujuan pembelajaran secara terstruktur
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              min="1"
              disabled={loading}
            />
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
              {loading ? "Menyimpan..." : module ? "Simpan Perubahan" : "Buat Modul"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
