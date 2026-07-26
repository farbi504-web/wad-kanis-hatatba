"use client";

import { useState, useEffect } from "react";
import { ImageOff, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SafeImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
  showIconOnError?: boolean;
  aspectRatio?: string;
};

/**
 * مكون صورة آمن يتعامل مع:
 * - URL فارغ/null
 * - فشل التحميل
 * - التحميل البطيء
 * - خطأ في CORS
 */
export function SafeImage({
  src,
  alt,
  fallback,
  showIconOnError = true,
  aspectRatio,
  className,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset state when src changes
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);
    setLoading(true);

    // Preload image
    const img = new window.Image();
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setLoading(false);
      setError(true);
    };
    img.src = src;
  }, [src]);

  if (!src || error) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-soft text-soft",
          className,
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {showIconOnError ? (
          <div className="flex flex-col items-center gap-1 text-xs">
            <ImageOff className="size-6" />
            <span>تعذر تحميل الصورة</span>
          </div>
        ) : (
          <ImageIcon className="size-8 opacity-30" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {loading && (
        <div className="absolute inset-0 skeleton" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className={cn(
          "w-full h-full object-cover transition-opacity",
          loading ? "opacity-0" : "opacity-100",
        )}
        {...props}
      />
    </div>
  );
}
