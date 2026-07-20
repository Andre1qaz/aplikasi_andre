"use client";

import { useState } from "react";
import { ForumThread, ForumReply } from "@/lib/api";
import { ArrowLeft, Pin, MessageCircle, User, Clock, Send, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — clear reply indicators
// Heuristic #18: Collaborative Learning — threaded reply structure

interface ForumThreadDetailProps {
  thread: ForumThread;
  onBack: () => void;
  onReply: (content: string) => Promise<void>;
  onUpdateThread?: (threadId: string, data: { title?: string; content?: string }) => Promise<void>;
  onDeleteThread?: (threadId: string) => Promise<void>;
  onUpdateReply?: (replyId: string, content: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  onPinThread?: (threadId: string) => Promise<void>;
  currentUserId?: string;
  userRole?: string;
}

export function ForumThreadDetail({
  thread,
  onBack,
  onReply,
  onUpdateThread,
  onDeleteThread,
  onUpdateReply,
  onDeleteReply,
  onPinThread,
  currentUserId,
  userRole,
}: ForumThreadDetailProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadData, setEditThreadData] = useState({ title: thread.title, content: thread.content });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      await onReply(replyContent);
      setReplyContent("");
      toast.success("Balasan berhasil dikirim");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim balasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    try {
      await onUpdateReply?.(replyId, editReplyContent);
      setEditingReplyId(null);
      setEditReplyContent("");
      toast.success("Balasan berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui balasan");
    }
  };

  const handleUpdateThread = async () => {
    if (!editThreadData.title.trim() || !editThreadData.content.trim()) {
      toast.error("Judul dan konten tidak boleh kosong");
      return;
    }

    try {
      await onUpdateThread?.(thread.id, editThreadData);
      setIsEditingThread(false);
      toast.success("Diskusi berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui diskusi");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus balasan ini?")) return;
    
    try {
      await onDeleteReply?.(replyId);
      toast.success("Balasan berhasil dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus balasan");
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus diskusi ini? Semua balasan juga akan dihapus.")) return;
    
    try {
      await onDeleteThread?.(thread.id);
      toast.success("Diskusi berhasil dihapus");
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus diskusi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {thread.course && (
            <p className="text-sm text-muted-foreground">
              {thread.course.code} - {thread.course.name}
            </p>
          )}
        </div>
        {(userRole === "DOSEN" || userRole === "ADMIN" || thread.authorId === currentUserId) && (
          <div className="flex gap-2">
            {userRole === "DOSEN" || userRole === "ADMIN" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPinThread?.(thread.id)}
              >
                <Pin className={cn("h-4 w-4 mr-2", thread.isPinned && "fill-current")} />
                {thread.isPinned ? "Lepas Semat" : "Sematkan"}
              </Button>
            ) : null}
            {thread.authorId === currentUserId && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingThread(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDeleteThread}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        )}
      </div>

      {/* Thread Content */}
      <Card className="p-6">
        {isEditingThread ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Judul</Label>
              <input
                id="edit-title"
                value={editThreadData.title}
                onChange={(e) => setEditThreadData({ ...editThreadData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Konten</Label>
              <Textarea
                id="edit-content"
                value={editThreadData.content}
                onChange={(e) => setEditThreadData({ ...editThreadData, content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateThread}>Simpan</Button>
              <Button variant="outline" onClick={() => setIsEditingThread(false)}>
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-4">
              {thread.isPinned && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Pin className="h-3 w-3 mr-1" />
                  Disematkan
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={thread.author.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(thread.author.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{thread.author.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(thread.createdAt)}
                </p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>
          </>
        )}
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Balasan ({thread.replies.length})
          </h2>
        </div>

        {thread.replies.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada balasan</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {thread.replies.map((reply) => (
              <Card key={reply.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={reply.author.avatarUrl || undefined} />
                    <AvatarFallback>{getInitials(reply.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{reply.author.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(reply.createdAt)}
                      </p>
                      {reply.updatedAt !== reply.createdAt && (
                        <Badge variant="outline" className="text-xs">
                          Diedit
                        </Badge>
                      )}
                    </div>
                    {editingReplyId === reply.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateReply(reply.id)}>
                            Simpan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditReplyContent("");
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    )}
                  </div>
                  {reply.author.id === currentUserId && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingReplyId(reply.id);
                          setEditReplyContent(reply.content);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReply(reply.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Tulis Balasan</h3>
        <div className="space-y-3">
          <Textarea
            placeholder="Tulis balasan Anda..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmitReply} disabled={isSubmitting || !replyContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
