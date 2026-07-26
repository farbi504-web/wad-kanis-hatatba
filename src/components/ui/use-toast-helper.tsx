"use client";

import { toast } from "sonner";

export function useToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    info: (msg: string) => toast.info(msg),
    warning: (msg: string) => toast.warning(msg),
    loading: (msg: string) => toast.loading(msg),
  };
}
