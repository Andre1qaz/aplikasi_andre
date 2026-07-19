"use client";

import { Toaster } from "sonner";

// Heuristic #1: Visibility of System Status — toast notifications for all actions
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}
