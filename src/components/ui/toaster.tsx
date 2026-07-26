"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      dir="rtl"
      toastOptions={{
        classNames: {
          toast: "font-arabic rounded-2xl border shadow-app-lg",
        },
      }}
    />
  );
}
