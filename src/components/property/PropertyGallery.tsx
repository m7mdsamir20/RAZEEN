"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { PropertyImage } from "@/types";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

const PLACEHOLDER = "/placeholder-property.svg";

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const t = useTranslations();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400">
        <ImageOff className="w-10 h-10" aria-hidden="true" />
        <span className="text-sm">{t("property.noImages")}</span>
      </div>
    );
  }

  function srcFor(index: number) {
    return failedIndexes.has(index) ? PLACEHOLDER : images[index].url;
  }

  function markFailed(index: number) {
    setFailedIndexes((prev) => new Set(prev).add(index));
  }

  function goPrev() {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function goNext() {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden">
        <Image
          src={srcFor(activeIndex)}
          alt={`${title} — ${activeIndex + 1}/${images.length}`}
          fill
          priority
          onError={() => markFailed(activeIndex)}
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />

        {images.length > 1 && (
          <>
            {/* Prev — logical start side; the chevron flips with the document direction */}
            <button
              onClick={goPrev}
              aria-label={t("common.previous")}
              className="absolute start-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/90 text-gray-700 rounded-full shadow-md hover:bg-white hover:text-primary transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </button>

            {/* Next — logical end side */}
            <button
              onClick={goNext}
              aria-label={t("common.next")}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-white/90 text-gray-700 rounded-full shadow-md hover:bg-white hover:text-primary transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </button>

            {/* Counter */}
            <span
              className="absolute bottom-3 end-3 px-2.5 py-1 text-xs font-medium text-white bg-black/60 rounded-full backdrop-blur-sm"
              aria-live="polite"
            >
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              aria-label={`${title} — ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
                index === activeIndex
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={
                  failedIndexes.has(index) ? PLACEHOLDER : image.thumbnailUrl
                }
                alt=""
                fill
                onError={() => markFailed(index)}
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
