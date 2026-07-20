"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { formatBytes } from "@/lib/utils";

// Heuristic #16: Instructional Assessment — detailed results with feedback
// Heuristic #1: Visibility of System Status — clear score display

interface ExamResultsProps {
  attempt: {
    id: string;
    startedAt: string;
    submittedAt: string;
    totalScore: number | null;
    status: string;
    examCheatLog: any;
  };
  exam: {
    title: string;
    duration: number;
    maxScore: number;
  };
  answers: Array<{
    question: {
      id: string;
      questionText: string;
      type: string;
      points: number;
      options?: Array<{
        id: string;
        optionText: string;
        isCorrect: boolean;
      }>;
    };
    score: number | null;
    feedback: string | null;
    answerText: string | null;
  }>;
  onRetake?: () => void;
  onBack?: () => void;
}

export function ExamResults({
  attempt,
  exam,
  answers,
  onRetake,
  onBack,
}: ExamResultsProps) {
  const score = attempt.totalScore || 0;
  const maxScore = exam.maxScore;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const isPassing = percentage >= 60;

  const cheatEvents = Array.isArray(attempt.examCheatLog) ? attempt.examCheatLog.length : 0;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return "bg-success/10 text-success";
    if (percentage >= 60) return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header with Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nilai Anda</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
                    {score}
                  </span>
                  <span className="text-muted-foreground">/ {maxScore}</span>
                  <Badge className={getScoreBadge(percentage)}>
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge variant={isPassing ? "default" : "destructive"}>
                  {isPassing ? "Lulus" : "Tidak Lulus"}
                </Badge>
              </div>
            </div>

            {/* Anti-cheat Warning */}
            {cheatEvents > 0 && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Peringatan Keamanan</p>
                  <p className="text-sm">
                    Terdeteksi {cheatEvents} kali perpindahan tab/window selama ujian
                  </p>
                </div>
              </div>
            )}

            {/* Time Info */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Mulai: {new Date(attempt.startedAt).toLocaleString("id-ID")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Selesai: {new Date(attempt.submittedAt).toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Answers */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Jawaban</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((answer, index) => (
              <div
                key={answer.question.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {index + 1}. {answer.question.questionText}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {answer.question.points} poin
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {answer.score !== null ? (
                      <>
                        <span className="font-semibold">{answer.score}</span>
                        <span className="text-muted-foreground">/ {answer.question.points}</span>
                        {answer.score === answer.question.points ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>

                {/* Student's Answer */}
                {answer.answerText && (
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Jawaban Anda:</p>
                    <p>{answer.answerText}</p>
                  </div>
                )}

                {/* Correct Answer for MC */}
                {answer.question.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {answer.question.options?.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          option.isCorrect
                            ? "bg-success/10 text-success"
                            : answer.answerText === option.id
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted/50"
                        }`}
                      >
                        {option.isCorrect && <CheckCircle className="h-4 w-4" />}
                        {answer.answerText === option.id && !option.isCorrect && (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>{option.optionText}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {answer.feedback && (
                  <div className="bg-info/10 p-3 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Feedback:</p>
                    <p>{answer.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Kembali ke Course
            </Button>
          )}
          {onRetake && (
            <Button onClick={onRetake}>
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
