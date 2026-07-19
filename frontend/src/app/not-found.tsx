import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
        <SearchX className="size-10" />
      </div>
      <h1 className="font-display text-4xl font-bold">404</h1>
      <h2 className="mt-2 text-xl font-semibold">Halaman Tidak Ditemukan</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        Halaman, course, atau modul yang Anda cari tidak ditemukan. Mungkin
        sudah dihapus atau URL-nya salah.
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
