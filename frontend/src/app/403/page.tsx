import Link from "next/link";
import { Home, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <ShieldX className="size-10" />
      </div>
      <h1 className="font-display text-4xl font-bold">403</h1>
      <h2 className="mt-2 text-xl font-semibold">Akses Ditolak</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini
        hanya dapat diakses oleh role yang sesuai.
      </p>
      <Button asChild className="mt-8 gap-2">
        <Link href="/">
          <Home className="size-4" />
          Kembali ke Dashboard
        </Link>
      </Button>
    </div>
  );
}
