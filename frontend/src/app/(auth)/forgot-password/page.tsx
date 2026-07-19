"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

// Heuristic #2: Match Between System and the Real World — institutional email flow
export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success(res.message);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-info/10 text-info">
            <Mail className="size-6" />
          </div>
          <CardTitle className="font-display text-2xl">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email institusi Anda. Kami akan mengirim instruksi reset password.
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">Email Institusi</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@ecourse.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Instruksi Reset"
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Periksa inbox email institusi Anda untuk instruksi selanjutnya.
            </p>
          </CardContent>
        )}
        <CardFooter>
          <Link href="/login" className="flex items-center gap-2 text-sm text-accent hover:underline mx-auto">
            <ArrowLeft className="size-4" />
            Kembali ke Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
