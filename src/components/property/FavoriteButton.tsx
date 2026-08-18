"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  propertyId: string;
  initialIsFavorite: boolean;
  /** Refresh the current route after toggling — used on the favourites page. */
  refreshOnToggle?: boolean;
  /**
   * "overlay" sits on top of a photo; "plain" sits on a white surface such as
   * the detail page heading.
   */
  variant?: "overlay" | "plain";
}

const VARIANT_CLASSES = {
  overlay: {
    active: "bg-white text-red-500",
    idle: "bg-black/40 text-white hover:bg-black/60",
  },
  plain: {
    active: "bg-red-50 text-red-500 border border-red-200",
    idle: "bg-gray-50 text-gray-500 border border-gray-200 hover:text-red-500 hover:border-red-200",
  },
} as const;

export function FavoriteButton({
  propertyId,
  initialIsFavorite,
  refreshOnToggle = false,
  variant = "overlay",
}: FavoriteButtonProps) {
  const t = useTranslations();
  const router = useRouter();

  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isPending, setIsPending] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // The button often sits inside a card link.
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    const optimistic = !isFavorite;
    setIsFavorite(optimistic);
    setIsPending(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });

      if (!res.ok) {
        setIsFavorite(!optimistic); // roll back
        return;
      }

      const data = (await res.json()) as { isFavorite: boolean };
      setIsFavorite(data.isFavorite);

      if (refreshOnToggle) router.refresh();
    } catch {
      setIsFavorite(!optimistic);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? t("property.removeFromFavorites")
          : t("property.addToFavorites")
      }
      className={`flex items-center justify-center rounded-full transition-[background-color,color,border-color] focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
        variant === "overlay" ? "w-9 h-9 backdrop-blur-sm" : "w-11 h-11"
      } ${
        VARIANT_CLASSES[variant][isFavorite ? "active" : "idle"]
      } ${isPending ? "opacity-70" : ""}`}
    >
      <Heart
        className={`${variant === "overlay" ? "w-4 h-4" : "w-5 h-5"} ${
          isFavorite ? "fill-current" : ""
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
