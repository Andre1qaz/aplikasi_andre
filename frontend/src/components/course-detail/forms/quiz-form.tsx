"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface QuizFormProps {
  weekId: string;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuizForm({ weekId, token, onSuccess, onCancel }: QuizFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [passingScore, setPassingScore] = useState("60");
  const [allowRetake, setAllowRetake] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "QUIZ",
            title,
            description,
            status: isPublished ? "PUBLISHED" : "DRAFT",
            order: 0,
            metadata: {
              duration: parseInt(duration),
              passingScore: parseInt(passingScore),
              allowRetake,
            },
          }),
        }
      );

      if (response.ok) {
        toast.success("Quiz created successfully");
        onSuccess();
      } else {
        toast.error("Failed to create quiz");
      }
    } catch (error) {
      toast.error("Error creating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passingScore">Passing Score (%)</Label>
        <Input
          id="passingScore"
          type="number"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
          min="0"
          max="100"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="allowRetake"
          checked={allowRetake}
          onCheckedChange={setAllowRetake}
        />
        <Label htmlFor="allowRetake">Allow Retake</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="published">Publish immediately</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Quiz"}
        </Button>
      </div>
    </form>
  );
}
